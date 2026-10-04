import type { Resume } from '@/types';

/**
 * DEVELOPMENT DATA — base documents available to IDENTITY FORGE.
 * In Phase 3 the same `Resume` shape is populated by the user document store
 * (Supabase in Phase 2). Files are never uploaded or parsed in Phase 1.
 */
export const mockResumes: Resume[] = [
  {
    id: 'rsv-base',
    label: 'BASE RESUME — ML ENGINEER',
    fileName: 'base_resume_ml_engineer.pdf',
    updatedAt: '2026-09-18',
    isBase: true,
    content: {
      summary:
        'Machine learning engineer with hands-on experience across supervised modelling, NLP pipelines and production analytics. Comfortable owning a model from data preparation through evaluation and monitoring, and documenting its failure modes honestly.',
      experience: [
        {
          company: 'Northfield Analytics',
          role: 'Machine Learning Engineer',
          period: 'Jul 2025 — Present',
          points: [
            'Built sentiment and intent classifiers over 1.2M customer records, improving macro-F1 from 0.71 to 0.84.',
            'Designed an offline evaluation harness that caught regressions before weekly releases.',
            'Reduced inference cost by 38% through batching and quantisation experiments.',
          ],
        },
        {
          company: 'Kestrel Data Labs',
          role: 'Data Science Intern',
          period: 'Jan 2025 — Jun 2025',
          points: [
            'Automated a weekly reporting pipeline over 40 source tables, removing roughly six hours of manual work.',
            'Built internal dashboards adopted by two commercial teams.',
          ],
        },
      ],
      skills: [
        'Python',
        'SQL',
        'Machine Learning',
        'Deep Learning',
        'Natural Language Processing',
        'PyTorch',
        'Pandas',
        'NumPy',
        'Statistics',
        'Data Analysis',
        'Git',
        'Docker',
        'Linux',
      ],
      education: 'B.Tech, Computer Science & Engineering — National Institute of Technology, 2025',
      projects: [
        'Retrieval evaluation toolkit — offline recall and ranking harness for internal document search.',
        'Forecast backtest notebook — hierarchical time-series baselines for regional demand data.',
      ],
    },
  },
  {
    id: 'rsv-analytics',
    label: 'VARIANT — DATA ANALYTICS',
    fileName: 'variant_data_analytics.pdf',
    updatedAt: '2026-09-22',
    isBase: false,
    content: {
      summary:
        'Analytics-focused resume variant. Leads with reporting, SQL modelling and decision support rather than model training.',
      experience: [
        {
          company: 'Northfield Analytics',
          role: 'Machine Learning Engineer',
          period: 'Jul 2025 — Present',
          points: [
            'Owned the semantic layer behind weekly commercial reporting across four business units.',
            'Partnered with data engineering to raise ingestion reliability and cut late-night pipeline failures.',
          ],
        },
        {
          company: 'Kestrel Data Labs',
          role: 'Data Science Intern',
          period: 'Jan 2025 — Jun 2025',
          points: [
            'Automated a weekly reporting pipeline over 40 source tables.',
            'Built internal dashboards adopted by two commercial teams.',
          ],
        },
      ],
      skills: [
        'SQL',
        'Python',
        'Data Analysis',
        'Data Visualization',
        'Pandas',
        'Statistics',
        'Tableau',
        'Power BI',
        'Git',
      ],
      education: 'B.Tech, Computer Science & Engineering — National Institute of Technology, 2025',
      projects: [
        'Regional performance reporting model with documented metric definitions.',
        'ETL reliability review across forty upstream source tables.',
      ],
    },
  },
  {
    id: 'rsv-research',
    label: 'VARIANT — APPLIED RESEARCH',
    fileName: 'variant_applied_research.pdf',
    updatedAt: '2026-09-26',
    isBase: false,
    content: {
      summary:
        'Research-leaning variant. Emphasises controlled experiments, baseline reproduction and written technical communication.',
      experience: [
        {
          company: 'Northfield Analytics',
          role: 'Machine Learning Engineer',
          period: 'Jul 2025 — Present',
          points: [
            'Reproduced and extended three published baselines, documenting results and negative findings.',
            'Ran ablations on transformer adaptation strategies across four domain corpora.',
          ],
        },
        {
          company: 'Kestrel Data Labs',
          role: 'Data Science Intern',
          period: 'Jan 2025 — Jun 2025',
          points: [
            'Built reproducible research environments for the internal experimentation group.',
            'Automated a weekly reporting pipeline over 40 source tables.',
          ],
        },
      ],
      skills: [
        'Python',
        'Deep Learning',
        'Machine Learning',
        'Natural Language Processing',
        'PyTorch',
        'Statistics',
        'NumPy',
        'Jupyter',
        'Research',
      ],
      education: 'B.Tech, Computer Science & Engineering — National Institute of Technology, 2025',
      projects: [
        'Transformer adaptation ablation study across four domain corpora.',
        'Retrieval evaluation toolkit — offline recall and ranking harness.',
      ],
    },
  },
];

export const mockResumeById = (id: string): Resume | undefined => mockResumes.find((resume) => resume.id === id);