export interface EnvironmentVariableStatus {
  key: string;
  configured: boolean;
  required: boolean;
  description: string;
}

export interface EnvironmentStatusReport {
  checkedAt: string;
  counts: {
    total: number;
    configured: number;
    missingRequired: number;
  };
  variables: EnvironmentVariableStatus[];
}

interface EnvironmentVariableDefinition {
  key: string;
  required: boolean;
  description: string;
}

const ENVIRONMENT_VARIABLES: EnvironmentVariableDefinition[] = [
  {
    key: "DATABASE_URL",
    required: true,
    description: "Postgres connection string for Policy Intel",
  },
  {
    key: "POLICY_INTEL_API_TOKEN",
    required: false,
    description: "Bearer token for API protection",
  },
  {
    key: "LEGISCAN_API_KEY",
    required: false,
    description: "LegiScan ingestion and legislator import",
  },
  {
    key: "OPENSTATES_API_KEY",
    required: false,
    description: "OpenStates committee membership import",
  },
  {
    key: "OPENAI_API_KEY",
    required: false,
    description: "Official audio transcription fallback",
  },
  {
    key: "ANTHROPIC_API_KEY",
    required: false,
    description: "Enhanced brief generation",
  },
  {
    key: "SLACK_WEBHOOK_URL",
    required: false,
    description: "Slack alert notifications",
  },
];

export function getEnvironmentStatusReport(): EnvironmentStatusReport {
  const variables = ENVIRONMENT_VARIABLES.map((entry) => {
    const raw = process.env[entry.key];
    const configured = typeof raw === "string" && raw.trim().length > 0;
    return {
      key: entry.key,
      configured,
      required: entry.required,
      description: entry.description,
    } satisfies EnvironmentVariableStatus;
  });

  const configured = variables.filter((item) => item.configured).length;
  const missingRequired = variables.filter((item) => item.required && !item.configured).length;

  return {
    checkedAt: new Date().toISOString(),
    counts: {
      total: variables.length,
      configured,
      missingRequired,
    },
    variables,
  };
}
