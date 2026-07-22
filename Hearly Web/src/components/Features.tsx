import React from 'react';
import { Cpu, ShieldCheck, Zap, Video, Lock, Radio } from 'lucide-react';

export const Features: React.FC = () => {
  const featureList = [
    {
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />,
      title: 'Low-Latency AudioWorklet',
      description:
        'Processes microphone PCM frames inside a browser render thread in under 15ms without introduced audio lag or echo.',
    },
    {
      icon: <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-purpleAccent" />,
      title: 'PyTorch & ONNX Verification',
      description:
        'Extracts a 192-dimensional speaker embedding vector using dilated 1D convolutions and SiLU activations.',
    },
    {
      icon: <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />,
      title: 'Microsoft VibeVoice ASR',
      description:
        'Transcribes live meeting speech with state-of-the-art HuggingFace VibeVoice speech recognition with CUDA/MPS acceleration.',
    },
    {
      icon: <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />,
      title: 'AES-GCM Local Encryption',
      description:
        'Meeting transcripts and voice history are encrypted at rest locally in IndexedDB using WebCrypto keys.',
    },
    {
      icon: <Video className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />,
      title: 'Meet, Zoom & MS Teams',
      description:
        'Lightweight content scripts hook seamlessly into Google Meet, Zoom, and Teams web applications.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />,
      title: '30-Sec Enrollment Flow',
      description:
        'Simple 3-step phrase reading flow generates your unique voice profile directly inside the extension popup.',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 md:py-28 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 px-2">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Engineered for <span className="accent-gradient-text">Privacy & Precision</span>
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-400 mt-3 sm:mt-4 leading-relaxed">
          Built with Manifest V3 and cutting-edge WebAudio & machine learning standards.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {featureList.map((feat, idx) => (
          <div
            key={idx}
            className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl glass-card hover:border-accent/30 transition-all duration-300 transform hover:-translate-y-1.5 group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 group-hover:bg-accent/10 group-hover:border-accent/30 transition-all">
                {feat.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-accent transition-colors">
                {feat.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
                {feat.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
