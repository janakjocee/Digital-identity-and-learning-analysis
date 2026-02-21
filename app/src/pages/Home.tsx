/**
 * Home Page
 * Landing page for the application
 */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Brain,
  Target,
  TrendingUp,
  Bot,
  ClipboardCheck,
  Users,
  Layers,
  ChevronRight,
  Star,
  CheckCircle,
  Play
} from 'lucide-react';
import { Button } from '../components/ui/button';

const features = [
  {
    icon: Target,
    title: 'Personalized Learning Paths',
    description: 'AI analyzes your learning style and creates custom study plans tailored to your strengths and weaknesses.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: TrendingUp,
    title: 'Smart Progress Tracking',
    description: 'Real-time analytics show your improvement with detailed insights into your learning patterns and achievements.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Bot,
    title: 'AI Tutor Assistance',
    description: 'Get instant help from our AI tutor available 24/7 to answer questions and explain complex concepts.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: ClipboardCheck,
    title: 'Adaptive Assessments',
    description: 'Quizzes that adapt to your skill level, providing the right challenge to maximize your learning potential.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: Users,
    title: 'Collaborative Learning',
    description: 'Connect with peers, join study groups, and learn together in an engaging social environment.',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    icon: Layers,
    title: 'Multi-Modal Content',
    description: 'Access video lessons, interactive simulations, reading materials, and hands-on exercises.',
    color: 'from-teal-500 to-green-500'
  }
];

const steps = [
  {
    number: '01',
    title: 'Create Your Profile',
    description: 'Sign up and tell us about your learning goals, subjects of interest, and current skill level.'
  },
  {
    number: '02',
    title: 'Take AI Assessment',
    description: 'Our AI evaluates your knowledge and identifies your strengths and areas for improvement.'
  },
  {
    number: '03',
    title: 'Get Personalized Plan',
    description: 'Receive a custom learning path designed specifically for your needs and learning style.'
  },
  {
    number: '04',
    title: 'Learn & Improve',
    description: 'Start learning with adaptive content, track your progress, and achieve your goals.'
  }
];

const subjects = [
  { name: 'Mathematics', description: 'Algebra, Geometry, Calculus, and more', color: 'bg-blue-500' },
  { name: 'Science', description: 'Physics, Chemistry, Biology fundamentals', color: 'bg-green-500' },
  { name: 'Programming', description: 'Python, JavaScript, Web Development', color: 'bg-purple-500' },
  { name: 'Languages', description: 'English, Spanish, French, Mandarin', color: 'bg-orange-500' },
  { name: 'History', description: 'World history, Civilizations, Events', color: 'bg-red-500' },
  { name: 'Arts', description: 'Music, Visual arts, Creative expression', color: 'bg-pink-500' },
  { name: 'Business', description: 'Economics, Marketing, Entrepreneurship', color: 'bg-indigo-500' },
  { name: 'Data Science', description: 'Analytics, Machine learning, Statistics', color: 'bg-teal-500' },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'High School Student',
    content: 'LearnSync AI completely changed how I study. The personalized approach helped me improve my grades by 40% in just one semester!',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'College Student',
    content: 'The AI tutor is like having a personal teacher available 24/7. It helped me understand complex programming concepts I struggled with for months.',
    rating: 5
  },
  {
    name: 'Emily Rodriguez',
    role: 'Working Professional',
    content: 'As someone balancing work and learning, the adaptive schedule is a game-changer. I can learn at my own pace without feeling overwhelmed.',
    rating: 5
  }
];

const pricingPlans = [
  {
    name: 'Basic',
    price: 'Free',
    description: 'Perfect for getting started',
    features: [
      'Access to basic courses',
      'Limited AI assistance',
      'Progress tracking',
      'Community access'
    ],
    cta: 'Get Started Free',
    highlighted: false
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'Best for serious learners',
    features: [
      'All Basic features',
      'Full AI tutor access',
      'Personalized learning paths',
      'Advanced analytics',
      'Priority support'
    ],
    cta: 'Start Pro Trial',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For schools & organizations',
    features: [
      'All Pro features',
      'Admin dashboard',
      'User management',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  return (
    <div ref={containerRef} className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background */}
        <motion.div
          style={{ y }}
          className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-purple-900/20"
        />
        
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-20 right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6"
              >
                <Brain className="w-4 h-4" />
                <span>AI-POWERED LEARNING</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              >
                Unlock Your Potential with{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI-Powered Learning
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg"
              >
                Personalized education that adapts to your unique learning style, 
                pace, and goals. Experience the future of education today.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 h-14 shadow-lg shadow-blue-500/25"
                  >
                    Start Learning Free
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 h-14"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center space-x-8 mt-12"
              >
                <div>
                  <p className="text-2xl font-bold">10,000+</p>
                  <p className="text-sm text-slate-500">Students</p>
                </div>
                <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <p className="text-2xl font-bold">95%</p>
                  <p className="text-sm text-slate-500">Success Rate</p>
                </div>
                <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <p className="text-2xl font-bold">50+</p>
                  <p className="text-sm text-slate-500">Courses</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Image/Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
                {/* Dashboard Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Your Progress</p>
                      <p className="text-2xl font-bold">78%</p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <p className="text-lg font-bold text-blue-600">24</p>
                      <p className="text-xs text-slate-500">Quizzes</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <p className="text-lg font-bold text-green-600">12</p>
                      <p className="text-xs text-slate-500">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <p className="text-lg font-bold text-purple-600">85%</p>
                      <p className="text-xs text-slate-500">Avg Score</p>
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Quiz Completed!</p>
                      <p className="text-sm font-bold">Score: 92%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-200 dark:border-slate-700"
                >
                  <p className="text-xs text-slate-500 mb-1">AI Recommendation</p>
                  <p className="text-sm font-medium">Try Advanced Algebra</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
              FEATURES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Powerful AI-Driven Features
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Our platform combines cutting-edge artificial intelligence with proven educational methodologies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="group p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-4">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Your Journey to Success
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Four simple steps to transform your learning experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <span className="text-3xl font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-600" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium mb-4">
              SUBJECTS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Explore Our Subjects
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Comprehensive curriculum covering essential topics for modern learners
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group cursor-pointer"
              >
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 ${subject.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{subject.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{subject.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-4">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What Our Students Say
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Real stories from real learners who transformed their education
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium mb-4">
              PRICING
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Choose Your Learning Plan
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Flexible options to fit your educational needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`relative p-8 rounded-2xl ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl shadow-blue-500/25 scale-105'
                    : 'bg-slate-50 dark:bg-slate-800/50'
                }`}>
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className={plan.highlighted ? 'text-white/80' : 'text-slate-500'}>{plan.period}</span>}
                    </div>
                    <p className={`text-sm mt-2 ${plan.highlighted ? 'text-white/80' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center space-x-3">
                        <CheckCircle className={`w-5 h-5 ${plan.highlighted ? 'text-white' : 'text-green-500'}`} />
                        <span className={plan.highlighted ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-white text-blue-600 hover:bg-white/90'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of students already using AI-powered education to achieve their goals.
            </p>
            <Link to="/register">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-white/90 text-lg px-8 h-14"
              >
                Start Learning Free
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-white/60">No credit card required</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}