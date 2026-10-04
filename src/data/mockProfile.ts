import type { CareerProfile } from '@/types';

/**
 * DEVELOPMENT DATA — fictional operator profile.
 * Replaced by Supabase in Phase 2 via the same `CareerProfile` shape.
 */
export const mockProfile: CareerProfile = {
  personal: {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@operator.dev',
    location: 'Bengaluru, India',
  },
  education: {
    degree: 'B.Tech, Computer Science & Engineering',
    college: 'National Institute of Technology',
    graduationYear: '2025',
  },
  skills: {
    programming: ['Python', 'JavaScript', 'SQL', 'TypeScript', 'Java'],
    aiml: ['Machine Learning', 'Deep Learning', 'Natural Language Processing', 'PyTorch', 'Statistics'],
    data: ['Pandas', 'NumPy', 'Data Analysis', 'Data Visualization', 'ETL'],
    tools: ['Git', 'Docker', 'Linux', 'PostgreSQL', 'Streamlit'],
  },
  careerTargets: {
    desiredRoles: ['Machine Learning Engineer', 'Data Scientist', 'AI Engineer'],
    locations: ['Bengaluru', 'Hyderabad', 'Pune', 'Remote'],
    remotePreference: 'HYBRID',
  },
  links: {
    github: 'github.com/operator-dev',
    linkedin: 'linkedin.com/in/operator-dev',
  },
};