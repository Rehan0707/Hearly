#!/usr/bin/env node
/**
 * Simple static scanner for common Hearly extension issues.
 * Outputs JSON and a short human summary to stdout.
 */
const fs = require('fs');
const path = require('path');

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e){ return null; } }
function read(p){ try { return fs.readFileSync(p,'utf8'); } catch(e){ return null; } }

const root = process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root')+1] : process.cwd();
const manifestPath = path.join(root,'public','manifest.json');
const constPath = path.join(root,'src','config','constants.ts');
const storagePath = path.join(root,'src','services','storageService.ts');
const procPath = path.join(root,'src','extension','hearly-processor.ts');
const injectedPath = path.join(root,'src','extension','injected-mic.ts');
const sharedPath = path.join(root,'src','extension','content','shared.ts');

const report = { manifest: {}, storage: {}, processor: {}, injected: {}, misc: [] };

// Manifest checks
const manifest = readJSON(manifestPath);
if (!manifest) {
  report.manifest.error = 'manifest.json not found or invalid JSON';
} else {
  report.manifest.permissions = manifest.permissions || [];
  report.manifest.has_windows = (manifest.permissions || []).includes('windows');
  report.manifest.web_accessible_resources = manifest.web_accessible_resources || manifest.web_accessible_resources || [];
  // check for worklet file reference presence
  const workletCandidates = ['hearly-processor.js','hearly-processor.mjs','hearly-processor.ts'];
  report.manifest.worklet_exposed = report.manifest.web_accessible_resources.some(w => workletCandidates.some(c => JSON.stringify(w).includes(c)));
  // CSP
  const csp = manifest.content_security_policy || manifest.contentSecurityPolicy || {};
  if (typeof csp === 'string') {
    report.manifest.csp = csp;
    report.manifest.allows_wasm_unsafe_eval = csp.includes('wasm-unsafe-eval') || csp.includes('unsafe-eval');
  } else {
    report.manifest.csp = JSON.stringify(csp);
    report.manifest.allows_wasm_unsafe_eval = JSON.stringify(csp).includes('wasm-unsafe-eval') || JSON.stringify(csp).includes('unsafe-eval');
  }
}

// STORAGE_KEYS checks
const constSrc = read(constPath);
if (!constSrc) {
  report.storage.error = 'constants.ts not found';
} else {
  const keys = {};
  constSrc.split('\n').forEach(line=>{
    const m = line.match(/STORAGE_KEYS\s*[:=]?.*{([^}]*)}/);
    if (m) {
      // crude parse
      const body = m[1];
      body.split(',').forEach(pair=>{
        const kv = pair.split(':')[0].trim().replace(/['"`]/g,'');
        if (kv) keys[kv]=true;
      });
    }
  });
  report.storage.keys = Object.keys(keys);
}

// storageService usage
const storageSrc = read(storagePath);
if (!storageSrc) {
  report.storage.service_missing = true;
} else {
  const uses = {};
  if (storageSrc.includes('hearly_voice_runtime_profile')) uses.runtime_profile_literal = true;
  if (storageSrc.includes('hearly_voice_profile')) uses.profile_literal = true;
  if (storageSrc.includes('STORAGE_KEYS')) uses.uses_constants = true;
  report.storage.usage = uses;
  if (report.storage.keys && report.storage.keys.length>0) {
    // detect mismatch: key names present but not used
    const missing = report.storage.keys.filter(k => !storageSrc.includes(k));
    report.storage.missing_in_service = missing;
  }
}

// Processor checks
const procSrc = read(procPath);
if (!procSrc) {
  report.processor.missing = true;
} else {
  const reg = procSrc.match(/registerProcessor\(['"]([^'\"]+)['"]/);
  const cls = procSrc.match(/class\s+([A-Za-z0-9_]+)\s+/);
  report.processor.registerName = reg ? reg[1] : null;
  report.processor.className = cls ? cls[1] : null;
  if (report.processor.className && !report.processor.className.includes('Voice')) {
    report.misc.push(`Processor class name '${report.processor.className}' might be misspelled (expected *Voice*).`);
  }
  if (report.processor.registerName && !report.processor.registerName.includes('hearly')) {
    report.misc.push(`Processor registration name '${report.processor.registerName}' does not include 'hearly'`);
  }
  if (procSrc.includes('HearyVoiceProcessor')) report.misc.push("Found 'HearyVoiceProcessor' typo in processor source.");
}

// Injected mic checks
const injSrc = read(injectedPath) || read(sharedPath);
if (!injSrc) {
  report.injected.missing = true;
} else {
  const nodeNameMatch = injSrc.match(/new\s+AudioWorkletNode\([^,]+,\s*['"]([^'\"]+)['"]/);
  report.injected.nodeName = nodeNameMatch ? nodeNameMatch[1] : null;
  const addModuleMatch = injSrc.match(/audioContext\.audioWorklet\.addModule\(([^)]+)\)/);
  report.injected.addModule = !!addModuleMatch;
}

// Search for other common typos
const walk = (dir, list=[])=>{
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir,f);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full,list);
      else {
        if (full.endsWith('.ts')||full.endsWith('.js')||full.endsWith('.json')) list.push(full);
      }
    }
  } catch(e){}
  return list;
};
const files = walk(root);
consttypo = (word)=> {
  const hits = [];
  files.forEach(f=>{
    try{
      const s = fs.readFileSync(f,'utf8');
      if (s.includes(word)) hits.push(f);
    }catch(e){}
  });
  return hits;
};
report.typos = {
  HearyVoiceProcessor: consttypo('HearyVoiceProcessor'),
  'hearly-voice-processor (node vs register mismatch)': []
};

// node/register mismatch heuristic
if (report.processor.registerName && report.injected.nodeName) {
  if (report.processor.registerName !== report.injected.nodeName) {
    report.typos['hearly-voice-processor (node vs register mismatch)'].push({
      register: report.processor.registerName,
      node: report.injected.nodeName
    });
  }
}

console.log(JSON.stringify(report, null, 2));

// Human summary
console.log('\nSUMMARY:');
if (report.manifest.error) console.log('- manifest error:', report.manifest.error);
else {
  if (!report.manifest.has_windows) console.log('- manifest: missing windows permission');
  if (!report.manifest.worklet_exposed) console.log('- manifest: worklet not exposed via web_accessible_resources');
  if (report.manifest.allows_wasm_unsafe_eval) console.log('- manifest: CSP allows wasm-unsafe-eval / unsafe-eval (audit risk)');
}
if (report.storage.error) console.log('- storage:', report.storage.error);
else {
  console.log('- storage keys found:', report.storage.keys || []);
  if (report.storage.missing_in_service && report.storage.missing_in_service.length) {
    console.log('- storage: keys defined in constants not referenced in storageService:', report.storage.missing_in_service.join(', '));
  }
  if (report.storage.usage && (report.storage.usage.runtime_profile_literal || report.storage.usage.profile_literal)) {
    console.log('- storage: literal keys found in storageService (possible duplication):', JSON.stringify(report.storage.usage));
  }
}
if (report.processor.missing) console.log('- processor file missing');
else {
  console.log(`- processor register name: ${report.processor.registerName || 'N/A'}, class: ${report.processor.className || 'N/A'}`);
}
if (report.injected.missing) console.log('- injected mic script missing');
else console.log(`- injected node name: ${report.injected.nodeName || 'N/A'}, addModule present: ${report.injected.addModule}`);
if (report.misc.length) {
  console.log('- misc notes:');
  report.misc.forEach(m=>console.log('  -',m));
}
console.log('\nEnd of scan.');
