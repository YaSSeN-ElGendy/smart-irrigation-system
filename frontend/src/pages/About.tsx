import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen } from 'lucide-react';

const TEAM = [
  { name: 'Yasen Elgendy', initials: 'YE' },
  { name: 'Mohamed Abdelrahman', initials: 'MA' },
  { name: 'Ziad Mousa', initials: 'ZM' },
];

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-surface rounded-xl shadow-sm border border-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-primary" size={28} />
          <h2 className="text-3xl font-bold text-text">About the Project</h2>
        </div>
        <p className="text-lg text-muted leading-relaxed max-w-3xl">
          The Smart Irrigation System is an IoT-based solution designed to automate and optimize watering processes. 
          By monitoring real-time environmental data—such as air temperature and soil moisture—the system intelligently 
          decides when to activate the water pump, conserving water while ensuring optimal conditions for plant growth. 
        </p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border p-8">
        <div className="flex items-center gap-3 mb-8">
          <Users className="text-primary" size={28} />
          <h2 className="text-3xl font-bold text-text">Meet the Team</h2>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-text">Faculty of Engineering, Port Said University</h3>
          <p className="text-muted">Computers & Control Department</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {TEAM.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * (idx + 1) }}
              className="flex items-center gap-4 bg-background p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xl shrink-0">
                {member.initials}
              </div>
              <div>
                <p className="font-semibold text-text">{member.name}</p>
                <p className="text-sm border text-muted border-transparent">Developer</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
