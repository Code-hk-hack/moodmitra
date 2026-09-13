"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Sparkles, Shield, HeartPulse, MessageSquare, ArrowRight, 
  BrainCircuit, Search, Lock, UserCheck, BookOpen, Clock,
  Play, BookMarked
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isLogoExpanded, setIsLogoExpanded] = useState(false);

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#4A3B32] overflow-x-hidden font-sans selection:bg-[#E99B77]/30 relative">
      
      {/* Soft abstract background elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#F2B591] rounded-full filter blur-[150px] opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#F6D5C7] rounded-full filter blur-[150px] opacity-30 pointer-events-none"></div>

      <AnimatePresence>
        {isLogoExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLogoExpanded(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FFF9F2]/90 backdrop-blur-md cursor-zoom-out"
          >
            <motion.img 
              layoutId="app-logo"
              src="/logo%20copy.png" 
              alt="MoodMitra Logo" 
              className="w-64 h-64 md:w-96 md:h-96 object-contain drop-shadow-2xl" 
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFF9F2]/80 backdrop-blur-xl border-b border-[#E99B77]/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <motion.img 
              layoutId="app-logo"
              src="/logo%20copy.png" 
              alt="MoodMitra Logo" 
              onClick={(e) => { e.stopPropagation(); setIsLogoExpanded(true); }}
              className="w-10 h-10 object-contain cursor-zoom-in brightness-90" 
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
            <span className="text-2xl font-serif font-bold tracking-tight text-[#4A3B32]">MoodMitra</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-[#8C7A6B]">
            <a href="#how-it-works" className="hover:text-[#E99B77] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#E99B77] transition-colors">Features</a>
            <a href="#research" className="hover:text-[#E99B77] transition-colors">Research</a>
          </div>
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-2.5 bg-[#FFF9F2] hover:bg-[#F2B591]/10 border border-[#E99B77]/20 text-[#E99B77] rounded-full text-sm font-semibold transition-all shadow-sm"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-40 pb-32 flex flex-col lg:flex-row items-center min-h-[90vh]">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="w-full lg:w-1/2 lg:pr-12 text-center lg:text-left z-20"
        >
          <motion.div variants={fadeUpVariant} className="inline-flex items-center space-x-2 bg-[#F2B591]/20 px-4 py-2 rounded-full mb-8 border border-[#E99B77]/20">
            <Sparkles size={14} className="text-[#E99B77]" />
            <span className="text-sm font-medium text-[#E99B77] tracking-wide uppercase">For NEET, JEE & Board Students</span>
          </motion.div>
          
          <motion.h1 variants={fadeUpVariant} className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.1] mb-6 text-[#4A3B32]">
            Your Safe Space to <br className="hidden md:block" />
            <span className="text-[#E99B77]">
              Talk, Heal, and Stay Strong
            </span>
          </motion.h1>
          
          <motion.p variants={fadeUpVariant} className="text-lg text-[#8C7A6B] mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
            MoodMitra is a teen emotional safety companion. Talk to an AI friend, get support, and stay emotionally safe while chasing your dreams.
          </motion.p>
          
          <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#F2B591] to-[#E99B77] text-white font-semibold rounded-full shadow-[0_10px_20px_rgba(233,155,119,0.3)] hover:shadow-[0_15px_30px_rgba(233,155,119,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center space-x-2"
            >
              <span>Start Talking Now</span>
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => router.push('/chat')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#4A3B32] font-medium rounded-full shadow-sm border border-[#E99B77]/20 hover:border-[#E99B77] transition-all flex items-center justify-center space-x-2"
            >
              <Play size={18} className="text-[#E99B77]" />
              <span>Watch Demo</span>
            </button>
          </motion.div>
          
          {/* Stats Section */}
          <motion.div variants={fadeUpVariant} className="mt-16 pt-8 border-t border-[#E99B77]/20 flex flex-wrap justify-center lg:justify-start gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <UserCheck size={20} className="text-[#E99B77]" />
                <h4 className="text-2xl font-serif font-bold">10K+</h4>
              </div>
              <p className="text-sm text-[#8C7A6B]">Active Students</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Sparkles size={20} className="text-[#E99B77]" />
                <h4 className="text-2xl font-serif font-bold">4.9</h4>
              </div>
              <p className="text-sm text-[#8C7A6B]">User Rating</p>
            </div>
          </motion.div>

        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full lg:w-1/2 mt-20 lg:mt-0 relative flex justify-center z-10"
        >
          {/* Aesthetic Background Blob */}
          <div className="absolute inset-0 bg-[#F2B591]/20 rounded-full blur-[80px]"></div>
          
          <div className="relative w-full max-w-lg aspect-square overflow-hidden flex items-end justify-center">
            <img 
              src="/mahiru_happy.png" 
              alt="Mahiru" 
              className="relative z-10 w-[95%] h-auto object-contain drop-shadow-[0_20px_40px_rgba(233,155,119,0.3)] brightness-95"
            />
            {/* Decorative Floating Badges */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 left-0 bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-[#E99B77]/20 shadow-[0_10px_30px_rgba(0,0,0,0.05)] z-20">
              <span className="text-sm font-semibold text-[#4A3B32]">👋 "I'm Mahiru, here to listen."</span>
            </motion.div>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 right-0 bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-[#E99B77]/20 shadow-[0_10px_30px_rgba(0,0,0,0.05)] z-20">
              <span className="text-sm font-semibold text-[#4A3B32]">"You got this." ✨</span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Wavy Divider */}
      <div className="relative h-[100px] w-full overflow-hidden bg-[#FFF9F2]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 w-full h-[100px] text-white fill-current">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C75.29,48.24,196.2,85.6,321.39,56.44Z"></path>
        </svg>
      </div>

      {/* 2. Problem Statement */}
      <section className="py-24 bg-white relative z-10">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          >
            <motion.div variants={fadeUpVariant} className="inline-flex items-center space-x-2 mb-6">
              <span className="text-xs font-bold text-[#E99B77] tracking-[0.2em] uppercase">Understanding You</span>
            </motion.div>
            <motion.h2 variants={fadeUpVariant} className="text-3xl md:text-5xl font-serif font-bold mb-8 text-[#4A3B32]">
              You’re Not Alone
            </motion.h2>
            <motion.p variants={fadeUpVariant} className="text-lg md:text-xl text-[#8C7A6B] leading-relaxed mb-8 font-light">
              NEET, JEE, and board exam students face extreme pressure every day. Fear of failure, parental expectations, loneliness, heartbreak, and self-doubt can feel overwhelming. Many students hide their feelings because they don’t want to be judged or burden anyone.
            </motion.p>
            <motion.p variants={fadeUpVariant} className="text-xl md:text-2xl font-serif font-medium text-[#E99B77] italic">
              MoodMitra is here to listen. No judgment. No pressure. <br className="hidden md:block"/> Just a safe space to share your thoughts and get support when you need it most.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* 3. How It Works - Cards section matching reference */}
      <section id="how-it-works" className="py-32 bg-[#FFF9F2] relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 flex flex-col items-center">
            <div className="inline-flex items-center space-x-2 mb-4">
              <Sparkles size={14} className="text-[#E99B77]" />
              <span className="text-xs font-bold text-[#E99B77] tracking-[0.2em] uppercase">Everything You Need</span>
              <Sparkles size={14} className="text-[#E99B77]" />
            </div>
            <h2 className="text-4xl font-serif font-bold mb-4">How MoodMitra Helps You</h2>
            <p className="text-[#8C7A6B] text-lg max-w-xl mx-auto">Your emotional safety journey in 4 simple steps. Designed to help you heal, reflect and bring your energy back to life.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Talk to Your Companion", desc: "Share your thoughts with Mahiru by text or voice. She's here to listen, not judge.", icon: <MessageSquare size={20} className="text-[#E99B77]" />, bgColor: "bg-[#FDF0E9]" },
              { title: "Get Guided Support", desc: "Receive calming exercises, coping tips, and emotional validation based on research.", icon: <BrainCircuit size={20} className="text-[#9DB0A3]" />, bgColor: "bg-[#EAF1EB]" },
              { title: "Track Your Mood", desc: "Log your mood daily and see your emotional patterns over time.", icon: <HeartPulse size={20} className="text-[#A3ADC2]" />, bgColor: "bg-[#ECF0F6]" },
              { title: "Stay Safe", desc: "If things feel too heavy, MoodMitra can help you reach out to trusted friends or family.", icon: <Shield size={20} className="text-[#C6A7B8]" />, bgColor: "bg-[#F5EAF0]" }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all flex flex-col h-full relative overflow-hidden group"
              >
                <div className={`w-12 h-12 rounded-full ${item.bgColor} flex items-center justify-center mb-6`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold font-serif mb-3 text-[#4A3B32]">{item.title}</h3>
                <p className="text-[#8C7A6B] text-sm leading-relaxed">{item.desc}</p>
                
                {/* Decorative floral accent in corner (simulated with abstract shapes for now) */}
                <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${item.bgColor} opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-24 bg-white relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4 text-[#4A3B32]">What You Get</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "AI Emotional Companion", desc: "Talk to Mahiru anytime, day or night." },
              { title: "Voice & Text Chat", desc: "Speak or type, whichever feels easier." },
              { title: "Exam Stress Mode", desc: "Special support for study pressure and burnout." },
              { title: "Heartbreak Support", desc: "Get help with relationship pain and loneliness." },
              { title: "Self-Doubt Reset", desc: "Build confidence and reframe negative thoughts." },
              { title: "Mood Tracking", desc: "Log your feelings and see your progress." },
              { title: "Crisis Safety", desc: "Trusted contact alerts when you need help." },
              { title: "Research-Inspired Tips", desc: "Advice based on real studies on student mental health." },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-[#FFF9F2] p-6 rounded-2xl border border-[#E99B77]/10 hover:border-[#E99B77]/40 transition-all flex items-start space-x-4 shadow-sm"
              >
                <div className="mt-1 text-[#E99B77] bg-white p-2 rounded-full shadow-sm"><Sparkles size={16} /></div>
                <div>
                  <h4 className="font-bold text-[#4A3B32] mb-1">{feature.title}</h4>
                  <p className="text-xs text-[#8C7A6B] leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why MoodMitra (USPs) */}
      <section className="py-32 bg-[#FFF9F2] relative z-10">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="text-4xl font-serif font-bold mb-8 text-[#4A3B32]">Why Students Trust MoodMitra</h2>
              <ul className="space-y-8">
                {[
                  { title: "Built for Indian Exam Teens", desc: "Designed specifically for NEET, JEE, and board students.", icon: <BookOpen size={20}/> },
                  { title: "Anime Companions", desc: "Friendly, relatable avatars that feel like elder siblings.", icon: <UserCheck size={20}/> },
                  { title: "Voice-First Comfort", desc: "Talk and hear responses, not just text.", icon: <MessageSquare size={20}/> },
                  { title: "Emotional Safety System", desc: "Combines support, tracking, and escalation.", icon: <Shield size={20}/> },
                  { title: "Privacy-First", desc: "Your conversations are private and secure.", icon: <Lock size={20}/> },
                ].map((usp, i) => (
                  <li key={i} className="flex items-start space-x-5">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#E99B77] shrink-0 border border-[#E99B77]/10">
                      {usp.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#4A3B32] mb-1">{usp.title}</h4>
                      <p className="text-sm text-[#8C7A6B]">{usp.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="w-full md:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#F2B591]/30 to-[#F6D5C7]/30 rounded-[3rem] transform rotate-3"></div>
              <div className="bg-white rounded-[3rem] p-10 border border-[#E99B77]/20 relative shadow-[0_20px_50px_rgba(233,155,119,0.15)] z-10">
                
                <div className="bg-[#FFF9F2] rounded-2xl p-6 border border-[#E99B77]/10 shadow-sm mb-6 transform -rotate-1 relative">
                  <div className="absolute -left-3 top-6 w-6 h-6 bg-[#FFF9F2] border-l border-t border-[#E99B77]/10 transform -rotate-45"></div>
                  <p className="text-sm text-[#4A3B32] font-medium leading-relaxed">"I completely blanked out on my mock test today. I feel like giving up."</p>
                </div>
                
                <div className="bg-gradient-to-r from-[#F2B591]/10 to-[#E99B77]/10 rounded-2xl p-6 border border-[#E99B77]/20 shadow-sm ml-8 transform rotate-1 relative">
                  <div className="absolute -right-3 top-6 w-6 h-6 bg-[#E99B77]/10 border-r border-t border-[#E99B77]/20 transform 45"></div>
                  <p className="text-sm text-[#4A3B32] leading-relaxed">"Take a deep breath. One bad mock doesn't define your final rank. Let's look at what went wrong without judging yourself. I'm right here with you."</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Research Foundation */}
      <section id="research" className="py-24 bg-white relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4 text-[#4A3B32]">Backed by Research</h2>
            <p className="text-[#8C7A6B] max-w-2xl mx-auto">MoodMitra is inspired by real studies on student mental health, emotional intelligence, and academic stress.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { stat: "2.4x", desc: "Academic stress increases depression risk in adolescents by 2.4x.", cite: "Jayanthi et al., 2015" },
              { stat: "86%", desc: "Of Indian students report high academic stress and parental pressure.", cite: "JEHP, 2024" },
              { stat: "0.79", desc: "Emotional intelligence strongly predicts academic success (r = 0.797).", cite: "Pradhan & Dash, 2026" }
            ].map((r, i) => (
              <div key={i} className="bg-[#FFF9F2] p-8 rounded-[2rem] border border-[#E99B77]/10 text-center hover:-translate-y-2 transition-transform shadow-sm">
                <h3 className="text-4xl font-serif font-black text-[#E99B77] mb-4">{r.stat}</h3>
                <p className="text-sm text-[#4A3B32] mb-6 leading-relaxed">{r.desc}</p>
                <div className="text-xs font-mono text-[#8C7A6B] bg-white border border-[#E99B77]/20 py-2 px-4 rounded-full inline-flex items-center">
                  <BookMarked size={12} className="mr-2 text-[#E99B77]"/>{r.cite}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="py-32 bg-[#FFF9F2] relative z-10">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-4xl font-serif font-bold mb-16 text-[#4A3B32]">What Students Say</h2>
          <div className="bg-white p-10 md:p-16 rounded-[3rem] border border-[#E99B77]/10 relative shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
            {/* Quote marks */}
            <div className="absolute top-8 left-10 text-6xl text-[#E99B77] opacity-20 font-serif">"</div>
            <p className="text-xl md:text-2xl font-serif text-[#4A3B32] italic mb-10 leading-relaxed relative z-10">
              I was feeling so low before my JEE mocks. Talking to Mahiru helped me calm down and sleep better. I didn’t feel alone anymore.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-[#F2B591] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">R</div>
              <div className="text-left">
                <h4 className="font-bold text-[#4A3B32]">Rohan</h4>
                <p className="text-xs text-[#8C7A6B]">Class 12, JEE Aspirant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Safety & Ethics */}
      <section className="py-24 bg-white border-y border-[#E99B77]/10 relative z-10">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <div className="w-20 h-20 bg-[#FDF0E9] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E99B77]/20">
            <Shield size={32} className="text-[#E99B77]" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-6 text-[#4A3B32]">Your Safety Matters</h2>
          <p className="text-[#8C7A6B] mb-8 leading-relaxed">
            MoodMitra is an emotional support companion, <strong className="text-[#4A3B32]">not a therapist</strong>. If you’re in crisis, we encourage you to talk to a trusted adult or professional.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm text-[#4A3B32] font-medium">
            <div className="bg-[#FFF9F2] px-6 py-3 rounded-full border border-[#E99B77]/20 shadow-sm">🔒 Data is private & secure</div>
            <div className="bg-[#FFF9F2] px-6 py-3 rounded-full border border-[#E99B77]/20 shadow-sm">🤝 Consent-based alerts</div>
            <div className="bg-[#FFF9F2] px-6 py-3 rounded-full border border-[#E99B77]/20 shadow-sm">👁️ No conversation sharing</div>
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-32 bg-[#FFF9F2] relative z-10 overflow-hidden">
        {/* Soft abstract blobs */}
        <div className="absolute inset-0 bg-[#F2B591]/10 rounded-full blur-[100px] transform scale-150"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-serif font-black mb-6 text-[#4A3B32]">You Don’t Have to Face This Alone</h2>
            <p className="text-xl text-[#8C7A6B] mb-10 max-w-2xl mx-auto font-light">
              Start talking to your companion today. It’s free, safe, and always here for you.
            </p>
            <button 
              onClick={() => router.push('/login')}
              className="px-10 py-5 bg-gradient-to-r from-[#F2B591] to-[#E99B77] text-white font-bold rounded-full text-lg shadow-[0_15px_30px_rgba(233,155,119,0.3)] hover:scale-105 transition-transform"
            >
              Start Your Journey Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-white py-12 border-t border-[#E99B77]/10 relative z-10 text-[#8C7A6B] text-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 text-center md:text-left">
            <div className="flex items-center space-x-2 text-[#4A3B32] font-serif font-bold text-xl">
              <img src="/logo%20copy.png" alt="MoodMitra Logo" className="w-8 h-8 object-contain brightness-90" />
              <span>MoodMitra</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 font-medium">
              <a href="#" className="hover:text-[#E99B77] transition-colors">About Us</a>
              <a href="#" className="hover:text-[#E99B77] transition-colors">Research</a>
              <a href="#" className="hover:text-[#E99B77] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#E99B77] transition-colors">Terms of Use</a>
              <a href="#" className="hover:text-[#E99B77] transition-colors">Contact</a>
              <a href="#" className="text-[#D97777] hover:text-[#C55A5A] transition-colors">Emergency Helplines</a>
            </div>
          </div>
          <div className="text-center text-[#8C7A6B]/60 border-t border-[#E99B77]/10 pt-8">
            © 2026 MoodMitra. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
