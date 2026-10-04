// Single source of truth for the site, llms.txt and the /mcp endpoint.
// Keep internal product names and confidential details out of this file.

export const profile = {
  name: "B D S Aritra",
  shortName: "Aritra",
  role: "AI software engineer",
  location: "Brooklyn, NY",
  summary:
    "I build AI agents that do real operations work. At Jefferies I design, ship and run agentic systems for trading operations teams, end to end, as the sole engineer.",
  email: "bdsaritra@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/bdsaritra",
    github: "https://github.com/aritrasaha18",
    calendly: "https://calendly.com/aritrasaha18",
    resume: "/resume.pdf",
    scholar: "https://scholar.google.com/citations?user=iU0VnUEAAAAJ",
  },
};

export type Role = {
  org: string;
  title: string;
  team?: string;
  place: string;
  start: string;
  end: string;
  highlights: string[];
};

export const experience: Role[] = [
  {
    org: "Jefferies",
    title: "AI Software Engineer",
    team: "Operations Technology",
    place: "Jersey City, NJ",
    start: "Jul 2025",
    end: "Present",
    highlights: [
      "Sole engineer on an AI trade-confirmation reconciliation platform, from product to build to DevOps. Shipped in 3 months; used by 1,000+ people across every trading middle-office team.",
      "Per-trade review went from 15–45 minutes to under 60 seconds, with 98% match/break accuracy confirmed by middle office, across 7 asset classes and 43 trade types.",
      "Architecture: React/TypeScript UI, a Node.js gateway with Azure AD auth, RBAC and streaming LLM orchestration, and 7 isolated Python MCP servers running up to 25 tool calls per trade, backed by an eval harness and full audit logging.",
      "Built a unified platform for 5 back-office teams, including a Claude agent that works through nearly 100K unmapped counterparty-code exceptions with analyst sign-off.",
      "Now building a daily reconciliation of swap-repository reports against 4 trading systems to flag alleged and orphan trades under CFTC, SEC and CSA rules.",
    ],
  },
  {
    org: "Jefferies",
    title: "Corporate Technology Intern",
    place: "Jersey City, NJ",
    start: "Jun 2024",
    end: "Aug 2024",
    highlights: [
      "Built a financial operations dashboard (Java, Spring Batch, Angular, AG Grid); cut Oracle load time from 12 s to under 1 s with indexing and server-side pagination.",
      "Added Cypress end-to-end tests covering 90%+ of critical flows in CI, cutting regression bugs by 40%.",
    ],
  },
  {
    org: "Trinity College",
    title: "Software Engineer & ML Research Assistant",
    place: "Hartford, CT",
    start: "Jan 2023",
    end: "May 2025",
    highlights: [
      "Shipped DiscountBytes, a group-discount app with occupancy-based dynamic pricing; signed 3 partner restaurants and lifted their traffic 20%.",
      "Trained CNN, GAN and LSTM models on NASA Solar Dynamics Observatory imagery to forecast coronal-hole activity.",
    ],
  },
];

export type Project = {
  name: string;
  blurb: string;
  stack: string;
  url: string;
};

export const projects: Project[] = [
  {
    name: "DiscountBytes",
    blurb:
      "Group discounts that rise and fall with a restaurant's real-time occupancy, with live coupons for diners.",
    stack: "React, Firebase, Tailwind CSS",
    url: "https://devpost.com/software/discountbytes",
  },
  {
    name: "Coronal hole forecasting",
    blurb:
      "Deep learning on NASA SDO imagery to predict coronal-hole activity, a driver of space weather.",
    stack: "TensorFlow, Keras, CNN-LSTM",
    url: "https://github.com/tarek-debug/Sunspot-Prediction-with-CNN-LSTM",
  },
  {
    name: "Campus shuttle service",
    blurb: "A shuttle service system for Trinity College, built as a software-design kata.",
    stack: "Kata project",
    url: "https://github.com/aritrasaha18/shuttle-service-kata-project",
  },
  {
    name: "Hypercubes",
    blurb: "Undergraduate mathematics research on hypercubes.",
    stack: "Mathematics research",
    url: "https://github.com/aritrasaha18/Hypercubes-Research",
  },
];

export const publications = [
  {
    title:
      "Scalability Matters: Overcoming Challenges in InstructGLM with Similarity-Degree-Based Sampling",
    venue: "IJCNN 2025",
    authors: "H. Lee, C. Yi, B.D.S. Aritra, M. Islam",
    url: "https://arxiv.org/abs/2505.03799",
  },
  {
    title: "Predicting Coronal Hole Activity: Key to Mitigating Space Weather Impacts",
    venue: "PAAISS 2024",
    authors: "T. Alsolame, B.D.S. Aritra, E. Niyonkuru, S. Antogiovanni, C. Chakraborttii",
    url: "https://link.springer.com/chapter/10.1007/978-3-031-94442-0_13",
  },
];

export const education = {
  school: "Trinity College",
  degree: "B.S. with Honors, Mathematics & Computer Science",
  gpa: "3.97",
  years: "2021–2025",
  note: "Teaching assistant for 5 courses, including Data Structures & Algorithms, Computer Systems and Discrete Math.",
};

export const skills = {
  "AI and LLMs": ["Agentic systems", "Tool calling", "MCP", "LLM evals", "Prompt engineering", "Vercel AI SDK", "LangChain"],
  Languages: ["Python", "TypeScript", "JavaScript", "SQL", "Java", "C"],
  Backend: ["Node.js", "Hono", "Bun", "FastAPI", "Spring Boot", "PostgreSQL", "Oracle", "Prisma"],
  Frontend: ["React", "Vite", "Tailwind CSS", "Angular", "AG Grid"],
  "ML and data": ["PyTorch", "TensorFlow", "scikit-learn", "Hugging Face", "Pandas", "PySpark"],
  Cloud: ["AWS Bedrock", "Lambda", "S3", "EKS", "Azure AD", "Docker", "Kubernetes"],
};
