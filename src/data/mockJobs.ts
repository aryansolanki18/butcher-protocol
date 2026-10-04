import type { JobAnalysis, JobListing, WorkMode } from '@/types';

/**
 * DEVELOPMENT DATA — fictional companies and listings.
 *
 * `analysis` mirrors the structured JSON Gemma 4 31B IT will return in
 * Phase 3. These are raw listings only: no score is stored here. Scores are
 * derived at read time from the operator's live profile via `deriveJobs`, so
 * editing the profile re-scores every target.
 */

interface JobSeed {
  id: string;
  source: string;
  postedAt: string;
  location: string;
  workMode: WorkMode;
  description: string;
  analysis: JobAnalysis;
}

const seeds: JobSeed[] = [
  {
    id: 'bp-001',
    source: 'TARGET NETWORK',
    postedAt: '2026-10-03T09:20:00Z',
    location: 'Bengaluru, India',
    workMode: 'HYBRID',
    description:
      'Helix Vector Labs is building a retrieval-augmented reasoning stack for enterprise knowledge bases. You will own model training pipelines end to end: dataset curation, fine-tuning, evaluation harnesses and production monitoring. Expect close pairing with platform engineers on deployment.',
    analysis: {
      role: 'Machine Learning Engineer',
      company: 'Helix Vector Labs',
      requiredSkills: ['Python', 'Machine Learning', 'PyTorch', 'Statistics', 'Deep Learning'],
      preferredSkills: ['Natural Language Processing', 'Docker', 'Linux'],
      experience: '1-3 years',
      education: 'B.Tech or equivalent in Computer Science or a related field',
      location: 'Bengaluru, India',
      employmentType: 'Full-time',
      summary:
        'Own end-to-end training and evaluation of retrieval-augmented language models in a small, senior team.',
      responsibilities: [
        'Build and maintain PyTorch training pipelines for retrieval-augmented generation',
        'Design offline evaluation harnesses and regression-test model releases',
        'Collaborate with platform engineering on production serving and monitoring',
        'Document model assumptions, data lineage and known failure modes',
      ],
    },
  },
  {
    id: 'bp-002',
    source: 'PUBLIC BOARD',
    postedAt: '2026-10-02T14:05:00Z',
    location: 'Hyderabad, India',
    workMode: 'REMOTE',
    description:
      'Northarc Systems is a mid-size logistics analytics firm. The role sits in a six-person insights group reporting to the Head of Analytics. You will turn messy operational data into decision-grade reporting and own the semantic layer behind it.',
    analysis: {
      role: 'Data Scientist',
      company: 'Northarc Systems',
      requiredSkills: ['Python', 'SQL', 'Statistics', 'Data Analysis', 'Spark'],
      preferredSkills: ['Pandas', 'Machine Learning', 'Data Visualization'],
      experience: '1-3 years',
      education: 'B.Tech, B.Sc. Statistics or equivalent quantitative degree',
      location: 'Hyderabad, India (Remote)',
      employmentType: 'Full-time',
      summary: 'Turn operational logistics data into decision-grade analysis for commercial and fleet teams.',
      responsibilities: [
        'Build and maintain the semantic layer powering executive dashboards',
        'Design experiments and quantify operational interventions',
        'Partner with engineering on Spark job reliability and cost',
        'Present findings to non-technical commercial leadership',
      ],
    },
  },
  {
    id: 'bp-003',
    source: 'DIRECT SIGNAL',
    postedAt: '2026-10-03T17:40:00Z',
    location: 'Bengaluru, India',
    workMode: 'ONSITE',
    description:
      'Quanterra is pre-revenue and hiring its first applied research engineer. You will work on speech and language models with direct access to compute, on-site in Bengaluru, five days a week. Heavy research bent, heavy implementation bent.',
    analysis: {
      role: 'AI Engineer',
      company: 'Quanterra',
      requiredSkills: ['Python', 'PyTorch', 'Deep Learning', 'Natural Language Processing'],
      preferredSkills: ['Transformers', 'Docker', 'Kubernetes'],
      experience: '0-2 years',
      education: 'B.Tech or M.Tech in Computer Science, or equivalent practical experience',
      location: 'Bengaluru, India',
      employmentType: 'Full-time',
      summary: 'First applied research hire at a pre-revenue AI company working directly on model training.',
      responsibilities: [
        'Train and adapt transformer architectures for domain-specific language tasks',
        'Run rigorous ablations and report results without overclaiming',
        'Build minimal reproducible research environments',
        'Work on-site with the founding research team',
      ],
    },
  },
  {
    id: 'bp-004',
    source: 'REMOTE BOUNTY BOARD',
    postedAt: '2026-09-29T08:15:00Z',
    location: 'Remote',
    workMode: 'REMOTE',
    description:
      'Tessellate AI sells document-understanding tooling to legal and insurance customers. Fully remote across India, async-first culture, quarterly on-sites. The team is small and the bar for craft is high.',
    analysis: {
      role: 'NLP Engineer',
      company: 'Tessellate AI',
      requiredSkills: ['Python', 'Natural Language Processing', 'Machine Learning', 'Statistics'],
      preferredSkills: ['PyTorch', 'Transformers', 'SQL'],
      experience: '1-3 years',
      education: 'B.E. / B.Tech in Computer Science or related discipline',
      location: 'Remote (India)',
      employmentType: 'Full-time',
      summary: 'Build document-extraction and classification models for regulated-industry customers.',
      responsibilities: [
        'Fine-tune and evaluate extraction models on noisy scanned documents',
        'Design precision/recall trade-offs for regulated customer workflows',
        'Own error analysis and maintain a labelled evaluation set',
        'Write clear internal documentation of model behaviour',
      ],
    },
  },
  {
    id: 'bp-005',
    source: 'PUBLIC BOARD',
    postedAt: '2026-09-27T11:30:00Z',
    location: 'Pune, India',
    workMode: 'ONSITE',
    description:
      'Blue Meridian Data is a retail analytics house of roughly 80 people. This is a reporting-heavy analyst seat with a real business surface: merchandising, supply chain and store operations all consume your numbers.',
    analysis: {
      role: 'Data Analyst',
      company: 'Blue Meridian Data',
      requiredSkills: ['SQL', 'Data Analysis', 'Pandas', 'Excel'],
      preferredSkills: ['Data Visualization', 'Power BI', 'Python'],
      experience: '0-2 years',
      education: 'B.Tech, B.Com or B.Sc. with analytics coursework',
      location: 'Pune, India',
      employmentType: 'Full-time',
      summary: 'Produce recurring commercial reporting for retail merchandising and store operations.',
      responsibilities: [
        'Own the weekly merchandising and supply-chain reporting pack',
        'Maintain and document SQL models used by the wider business',
        'Investigate data discrepancies and communicate root causes',
        'Improve dashboard readability and adoption across departments',
      ],
    },
  },
  {
    id: 'bp-006',
    source: 'TARGET NETWORK',
    postedAt: '2026-09-30T10:00:00Z',
    location: 'Bengaluru, India',
    workMode: 'HYBRID',
    description:
      'Latticefold runs a model platform used by three other product companies. The MLOps seat sits between platform and product: you will make training reproducible, deployment boring, and monitoring real.',
    analysis: {
      role: 'MLOps Engineer',
      company: 'Latticefold',
      requiredSkills: ['Python', 'Docker', 'Linux', 'Kubernetes'],
      preferredSkills: ['Git', 'SQL', 'Cloud Infrastructure', 'Terraform'],
      experience: '1-3 years',
      education: 'B.Tech in Computer Science or equivalent hands-on experience',
      location: 'Bengaluru, India',
      employmentType: 'Full-time',
      summary: 'Own the shared model platform: reproducibility, deployment and production monitoring.',
      responsibilities: [
        'Containerise training and inference workloads',
        'Build CI/CD paths for model artifacts and their metadata',
        'Instrument production models and own alerting',
        'Reduce platform toil through automation and clear runbooks',
      ],
    },
  },
  {
    id: 'bp-007',
    source: 'DIRECT SIGNAL',
    postedAt: '2026-09-25T16:45:00Z',
    location: 'Hyderabad, India',
    workMode: 'ONSITE',
    description:
      'Corvid Analytics builds reporting infrastructure for insurance clients. Engineering-heavy data work: ingestion reliability, modelling conventions, and query performance under real production load.',
    analysis: {
      role: 'Data Engineer',
      company: 'Corvid Analytics',
      requiredSkills: ['SQL', 'ETL', 'Python', 'Snowflake', 'Data Modeling'],
      preferredSkills: ['PostgreSQL', 'Spark', 'Airflow'],
      experience: '1-3 years',
      education: 'B.Tech in Computer Science, Data Engineering or related field',
      location: 'Hyderabad, India',
      employmentType: 'Full-time',
      summary: 'Build and harden the ingestion and modelling layer behind regulated insurance reporting.',
      responsibilities: [
        'Design and operate ingestion pipelines with explicit data contracts',
        'Model client-facing reporting entities for consistency',
        'Tune warehouse performance for heavy concurrent workloads',
        'Establish data quality checks and incident runbooks',
      ],
    },
  },
  {
    id: 'bp-008',
    source: 'PUBLIC BOARD',
    postedAt: '2026-09-28T13:10:00Z',
    location: 'Bengaluru, India',
    workMode: 'ONSITE',
    description:
      'Ironvale Robotics manufactures warehouse picking hardware. The vision team works on on-site deployment: capture rigs, edge inference and the unglamorous calibration work that makes it reliable.',
    analysis: {
      role: 'Computer Vision Engineer',
      company: 'Ironvale Robotics',
      requiredSkills: ['Python', 'OpenCV', 'PyTorch', 'Deep Learning', 'Computer Vision'],
      preferredSkills: ['Linux', 'Docker', 'CUDA'],
      experience: '1-3 years',
      education: 'B.Tech in Computer Science, Electronics or related field',
      location: 'Bengaluru, India',
      employmentType: 'Full-time',
      summary: 'Deploy and calibrate vision systems on industrial picking hardware at warehouse sites.',
      responsibilities: [
        'Train and tune detection and grasping models for varied lighting',
        'Build capture and calibration tooling for field engineers',
        'Optimise inference for constrained edge hardware',
        'Diagnose field failures and convert them into dataset fixes',
      ],
    },
  },
  {
    id: 'bp-009',
    source: 'REMOTE BOUNTY BOARD',
    postedAt: '2026-10-01T07:25:00Z',
    location: 'Remote',
    workMode: 'REMOTE',
    description:
      'Signalfern is a distributed team of eleven. This is an applied ML seat with real ownership: you take a model from notebook to monitored production endpoint and support it afterwards.',
    analysis: {
      role: 'Applied ML Engineer',
      company: 'Signalfern',
      requiredSkills: ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Model Deployment'],
      preferredSkills: ['Docker', 'FastAPI', 'PostgreSQL'],
      experience: '1-3 years',
      education: 'Degree in a quantitative discipline or equivalent self-taught practice',
      location: 'Remote (Global)',
      employmentType: 'Full-time',
      summary: 'Own applied ML features from prototype through monitored production endpoints.',
      responsibilities: [
        'Ship models behind service APIs with clear contracts',
        'Instrument endpoints and respond to drift',
        'Write tests and documentation alongside features',
        'Participate directly in async design and incident review',
      ],
    },
  },
  {
    id: 'bp-010',
    source: 'PUBLIC BOARD',
    postedAt: '2026-10-03T12:00:00Z',
    location: 'Pune, India',
    workMode: 'HYBRID',
    description:
      'Nimbus Grid is scaling a forecasting product for regional utilities. They want a junior-to-mid data scientist who can own a product surface rather than shadow a senior.',
    analysis: {
      role: 'Data Scientist',
      company: 'Nimbus Grid',
      requiredSkills: ['Python', 'Statistics', 'Data Analysis', 'SQL'],
      preferredSkills: ['Pandas', 'Machine Learning', 'Data Visualization', 'Tableau'],
      experience: '0-2 years',
      education: 'B.Tech or B.Sc. in a quantitative field',
      location: 'Pune, India',
      employmentType: 'Full-time',
      summary: 'Own demand-forecasting models for utility customers from data prep to product delivery.',
      responsibilities: [
        'Build and backtest short-horizon demand forecasting models',
        'Communicate model uncertainty to product and operations teams',
        'Maintain data pipelines feeding the forecasting service',
        'Own a product surface end to end within a small team',
      ],
    },
  },
  {
    id: 'bp-011',
    source: 'DIRECT SIGNAL',
    postedAt: '2026-09-24T18:30:00Z',
    location: 'Remote',
    workMode: 'REMOTE',
    description:
      'Palewave Compute provides GPU scheduling for research teams. Infrastructure-heavy role: capacity, isolation and cost. Less modelling, considerably more systems work.',
    analysis: {
      role: 'AI Infrastructure Engineer',
      company: 'Palewave Compute',
      requiredSkills: ['Python', 'Linux', 'Docker', 'Kubernetes', 'Cloud Infrastructure'],
      preferredSkills: ['Terraform', 'Git', 'C++'],
      experience: '2-5 years',
      education: 'B.Tech in Computer Science or equivalent infrastructure practice',
      location: 'Remote (Global)',
      employmentType: 'Full-time',
      summary: 'Harden GPU scheduling infrastructure for isolated research workloads at scale.',
      responsibilities: [
        'Operate multi-tenant scheduling and isolation guarantees',
        'Reduce cost through utilisation and bin-packing improvements',
        'Maintain reproducible infrastructure definitions',
        'Support customers debugging environment-level failures',
      ],
    },
  },
  {
    id: 'bp-012',
    source: 'PUBLIC BOARD',
    postedAt: '2026-10-04T06:15:00Z',
    location: 'Bengaluru, India',
    workMode: 'ONSITE',
    description:
      'Arclight Inference is hiring its first graduate-level AI engineer as the company scales past 400 people. Structured mentorship, defined ownership, and a mandate to ship real features in the first quarter.',
    analysis: {
      role: 'AI Engineer',
      company: 'Arclight Inference',
      requiredSkills: ['Python', 'Machine Learning', 'Statistics'],
      preferredSkills: ['Pandas', 'SQL', 'Git'],
      experience: '0-2 years',
      education: 'B.Tech in Computer Science or equivalent',
      location: 'Bengaluru, India',
      employmentType: 'Full-time',
      summary: 'Graduate AI engineer seat with structured mentorship and real feature ownership from quarter one.',
      responsibilities: [
        'Build and evaluate classification and ranking features',
        'Participate in code review and engineering standards discussions',
        'Instrument services and report reliability metrics',
        'Work with senior engineers through a defined mentorship track',
      ],
    },
  },
  {
    id: 'bp-013',
    source: 'PUBLIC BOARD',
    postedAt: '2026-09-22T10:40:00Z',
    location: 'Mumbai, India',
    workMode: 'HYBRID',
    description:
      'Fieldstone Retail Labs supports a chain of 300+ stores. Reporting and reporting tooling. Fast-paced, frequently changing stakeholders, limited research scope.',
    analysis: {
      role: 'Data Analyst',
      company: 'Fieldstone Retail Labs',
      requiredSkills: ['SQL', 'Data Analysis', 'Excel', 'Report Generation'],
      preferredSkills: ['Tableau', 'Python', 'Data Visualization'],
      experience: '0-2 years',
      education: 'Degree with quantitative coursework',
      location: 'Mumbai, India',
      employmentType: 'Full-time',
      summary: 'Produce store-level commercial reporting for a fast-moving retail chain.',
      responsibilities: [
        'Produce recurring store and regional performance reporting',
        'Maintain report definitions and document changes',
        'Support ad-hoc commercial analysis requests',
        'Improve reporting tooling and reduce manual effort',
      ],
    },
  },
  {
    id: 'bp-014',
    source: 'TARGET NETWORK',
    postedAt: '2026-09-26T15:20:00Z',
    location: 'Hyderabad, India',
    workMode: 'HYBRID',
    description:
      'Vertexcore Systems runs a research group inside a larger consultancy. Expect literature reading, carefully controlled experiments and external client deliverables alongside internal research.',
    analysis: {
      role: 'ML Research Associate',
      company: 'Vertexcore Systems',
      requiredSkills: ['Python', 'Deep Learning', 'Statistics', 'Machine Learning', 'Research'],
      preferredSkills: ['NumPy', 'Pandas', 'Jupyter'],
      experience: '0-2 years',
      education: 'B.Tech / M.Tech in Computer Science or a related field',
      location: 'Hyderabad, India',
      employmentType: 'Full-time',
      summary: 'Run controlled experiments in an applied research group serving external clients.',
      responsibilities: [
        'Reproduce and extend published baselines',
        'Design controlled experiments with clear success criteria',
        'Prepare client-facing technical documentation',
        'Maintain reproducible research environments',
      ],
    },
  },
];

function toListing(seed: JobSeed): JobListing {
  return {
    id: seed.id,
    title: seed.analysis.role,
    company: seed.analysis.company,
    location: seed.location,
    workMode: seed.workMode,
    source: seed.source,
    postedAt: seed.postedAt,
    description: seed.description,
    skills: [...seed.analysis.requiredSkills, ...seed.analysis.preferredSkills],
    analysis: seed.analysis,
  };
}

/** The development-data registry. Locally pasted targets are appended to this. */
export const mockJobListings: JobListing[] = seeds.map(toListing);

export const mockJobById = (id: string): JobListing | undefined => mockJobListings.find((job) => job.id === id);

/** Every distinct location present in the mock dataset, for filter dropdowns. */
export const mockJobLocations: string[] = [...new Set(mockJobListings.map((job) => job.location))].sort();

/** Every distinct role present in the mock dataset, for filter dropdowns. */
export const mockJobRoles: string[] = [...new Set(mockJobListings.map((job) => job.title))].sort();