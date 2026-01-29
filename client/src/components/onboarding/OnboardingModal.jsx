import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { braindumpApi, projectsApi } from '../../services/api';
import { Button, Input, Select, Card } from '../common';

const CONTEXTS = [
  { value: '@anywhere', label: '@anywhere' },
  { value: '@phone', label: '@phone' },
  { value: '@computer', label: '@computer' },
  { value: '@office', label: '@office' },
  { value: '@errands', label: '@errands' },
  { value: '@home', label: '@home' }
];

export default function OnboardingModal() {
  const { showUnload, completeUnload, completeMission } = useOnboarding();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('dump'); // dump | process | done
  const [thoughts, setThoughts] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [savedItems, setSavedItems] = useState([]);
  const [processingItem, setProcessingItem] = useState(null);
  const [decision, setDecision] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    context: '@anywhere',
    estimatedMinutes: '',
    category: 'someday'
  });
  const inputRef = useRef(null);

  useEffect(() => {
    if (showUnload && phase === 'dump') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [showUnload, phase]);

  if (!showUnload) return null;

  const handleAddThought = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setThoughts(prev => [...prev, inputValue.trim()]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleDumpDone = async () => {
    if (thoughts.length === 0) return;
    try {
      const res = await braindumpApi.createBulk(thoughts);
      setSavedItems(res.data);
      setProcessingItem(res.data[0]);
      setFormData(prev => ({ ...prev, title: res.data[0].content }));
      completeMission('dump');
      setPhase('process');
    } catch (error) {
      console.error('Failed to save thoughts:', error);
    }
  };

  const handleSkip = async () => {
    await completeUnload();
  };

  const handleDecision = async (type) => {
    if (type === 'delete' || type === 'doNow') {
      try {
        await braindumpApi.process(processingItem._id, 'delete', {});
        completeMission('process');
        setPhase('done');
      } catch (error) {
        console.error('Failed to process:', error);
      }
      return;
    }
    setDecision(type);
  };

  const handleProcess = async () => {
    try {
      const cleanedData = {
        ...formData,
        estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : null
      };
      await braindumpApi.process(processingItem._id, decision, cleanedData);
      completeMission('process');
      setPhase('done');
    } catch (error) {
      console.error('Failed to process:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinish = async () => {
    await completeUnload();
    navigate('/braindump');
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-900 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {/* Phase 1: Dump */}
          {phase === 'dump' && (
            <motion.div
              key="dump"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Logo */}
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-dark-100">Your brain is full.</h1>
                <h2 className="text-2xl font-bold text-primary-400">Let's empty it.</h2>
                <p className="text-dark-400 text-sm mt-2">
                  Type whatever's bouncing around in there. Don't organize — just dump.
                </p>
              </div>

              {/* Input */}
              <form onSubmit={handleAddThought}>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="What's on your mind?"
                    containerClassName="flex-1"
                  />
                  <Button type="submit" disabled={!inputValue.trim()}>
                    Dump
                  </Button>
                </div>
              </form>

              {/* Thought cards */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {thoughts.map((thought, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-dark-200 text-sm"
                    >
                      {thought}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {thoughts.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button onClick={handleDumpDone} fullWidth>
                      I'm done — {thoughts.length} thought{thoughts.length !== 1 ? 's' : ''} dumped
                    </Button>
                  </motion.div>
                )}
                <button
                  onClick={handleSkip}
                  className="w-full text-center text-sm text-dark-500 hover:text-dark-400 transition-colors py-2"
                >
                  Skip — I'll figure it out
                </button>
              </div>
            </motion.div>
          )}

          {/* Phase 2: Process */}
          {phase === 'process' && processingItem && (
            <motion.div
              key="process"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div className="text-center">
                <h1 className="text-xl font-bold text-dark-100">Now pick what to do with this one.</h1>
              </div>

              {/* The item */}
              <Card variant="glass" padding="sm">
                <p className="text-dark-100 font-medium">{processingItem.content}</p>
              </Card>

              {!decision && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <p className="text-dark-400 text-sm">What should happen with this?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => handleDecision('action')} className="flex flex-col items-center py-4">
                      <span className="text-2xl mb-1">✓</span>
                      <span>It's an Action</span>
                    </Button>
                    <Button variant="secondary" onClick={() => handleDecision('project')} className="flex flex-col items-center py-4">
                      <span className="text-2xl mb-1">📁</span>
                      <span>It's a Project</span>
                    </Button>
                    <Button variant="secondary" onClick={() => handleDecision('someday')} className="flex flex-col items-center py-4">
                      <span className="text-2xl mb-1">⭐</span>
                      <span>Someday/Maybe</span>
                    </Button>
                    <Button variant="secondary" onClick={() => handleDecision('doNow')} className="flex flex-col items-center py-4">
                      <span className="text-2xl mb-1">⚡</span>
                      <span>Do it Now!</span>
                    </Button>
                    <Button variant="ghost" onClick={() => handleDecision('delete')} className="col-span-2 text-dark-500">
                      Not actionable — Delete
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Action form */}
              {decision === 'action' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Input label="What's the action?" name="title" value={formData.title} onChange={handleChange} />
                  <Select label="Context" name="context" value={formData.context} onChange={handleChange} options={CONTEXTS} />
                  <Input label="Est. Minutes" name="estimatedMinutes" type="number" value={formData.estimatedMinutes} onChange={handleChange} placeholder="e.g., 15" />
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setDecision(null)} className="flex-1">Back</Button>
                    <Button onClick={handleProcess} className="flex-1">Create Action</Button>
                  </div>
                </motion.div>
              )}

              {/* Project form */}
              {decision === 'project' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Input label="Project Title" name="title" value={formData.title} onChange={handleChange} />
                  <Input label="Description" name="description" value={formData.description} onChange={handleChange} placeholder="What does this involve?" />
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setDecision(null)} className="flex-1">Back</Button>
                    <Button onClick={handleProcess} className="flex-1">Create Project</Button>
                  </div>
                </motion.div>
              )}

              {/* Someday form */}
              {decision === 'someday' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Input label="Title" name="title" value={formData.title} onChange={handleChange} />
                  <Select label="Category" name="category" value={formData.category} onChange={handleChange} options={[
                    { value: 'someday', label: 'Someday' },
                    { value: 'maybe', label: 'Maybe' },
                    { value: 'idea', label: 'Idea' },
                    { value: 'skill', label: 'Skill to Learn' },
                    { value: 'hobby', label: 'Hobby' }
                  ]} />
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setDecision(null)} className="flex-1">Back</Button>
                    <Button onClick={handleProcess} className="flex-1">Add to Someday</Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Phase 3: Done */}
          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-center py-8"
            >
              <div>
                <h1 className="text-2xl font-bold text-dark-100 mb-2">That's the whole system.</h1>
                <p className="text-dark-400 text-sm">Everything else is just variations of this.</p>
              </div>

              {/* Capture → Decide → Do */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-xl bg-warning-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-dark-200">Capture</span>
                </div>

                <svg className="w-5 h-5 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-dark-200">Decide</span>
                </div>

                <svg className="w-5 h-5 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-xl bg-success-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-dark-200">Do</span>
                </div>
              </div>

              <div>
                <p className="text-dark-400 text-sm mb-1">You've got it.</p>
                <p className="text-dark-500 text-xs">
                  {savedItems.length > 1
                    ? `You still have ${savedItems.length - 1} thought${savedItems.length - 1 !== 1 ? 's' : ''} to process.`
                    : 'Check the home screen for starter missions to explore more.'}
                </p>
              </div>

              <Button onClick={handleFinish} fullWidth>
                Let's go
              </Button>

              {/* David Allen attribution */}
              <p className="text-dark-600 text-xs leading-relaxed pt-2">
                Huge thanks to{' '}
                <a
                  href="https://gettingthingsdone.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dark-500 hover:text-dark-400 underline underline-offset-2 transition-colors"
                >
                  David Allen
                </a>
                , creator of the GTD methodology this app is based on.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
