import path from 'path'
import fs from 'fs'
import convict from 'convict'
import * as dotenv from 'dotenv'

const envFilePath = path.resolve(__dirname, '../../../.env.doppler.override')
if (fs.existsSync(envFilePath)) {
  try {
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath))
    for (const k in envConfig) {
      process.env[k] = envConfig[k]
    }
  } catch (e) {
    // do nothing
  }
}

let dotEnvConfig = {}

export enum AppEnv {
  Prod = 'production',
  QA = 'qa',
  Dev = 'dev',
  Test = 'test'
}

if (process.env.NODE_ENV === 'test') {
  if (process.env.GITHUB_ACTIONS === 'true') {
    dotEnvConfig = {
      path: path.join(__dirname, '../../.env.test.ci')
    }
  } else {
    dotEnvConfig = {
      path: path.join(__dirname, '../../.env.test.local')
    }
  }
}
dotenv.config(dotEnvConfig)

convict.addFormat({
  name: 'validatedArray',
  validate: function (sources) {
    if (!Array.isArray(sources)) {
      throw new Error('Must be of type Array')
    }
  },
  coerce: function (sources) {
    return sources.split(',').map((item: string) => item.trim())
  }
})

export const config = convict({
  appEnv: {
    doc: 'The application environment',
    format: isAppEnv,
    default: AppEnv.Dev,
    env: 'APP_ENV'
  },
  loggerTransport: {
    tcp: {
      host: {
        doc: 'Pino Logger TCP Host',
        format: nonRequiredString,
        default: undefined,
        env: 'LOGGER_TCP_HOST'
      },
      port: {
        doc: 'Pino Logger TCP Port',
        format: nonRequiredString,
        default: undefined,
        env: 'LOGGER_TCP_PORT'
      }
    }
  },
  logPrettyPrint: {
    doc: 'Pretty Print logs to console',
    format: 'Boolean',
    default: false,
    env: 'LOG_PRETTY_PRINT'
  },
  logLevel: {
    doc: 'The log level',
    format: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'],
    default: 'debug',
    env: 'LOG_LEVEL'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT',
    arg: 'port'
  },
  externalUrl: {
    doc: 'The external URL of the service',
    format: String,
    default: 'http://localhost:3000',
    env: 'BACKEND_EXTERNAL_URL'
  },
  productionUrlOpenAPI: {
    doc: 'The external URL of the service',
    format: String,
    default: 'https://api.skyfire.xyz',
    env: 'PRODUCTION_BACKEND_EXTERNAL_URL'
  },
  skyfireUserHelpUrl: {
    doc: 'Skyfire User Help URL',
    format: String,
    default: 'https://docs.skyfire.xyz',
    env: 'SKYFIRE_USER_HELP_URL'
  },
  corsAllowedDomains: {
    doc: 'CORS allowed domains',
    format: String,
    default: '["http://localhost:3000/", "skyfire.xyz", "onrender.com"]',
    env: 'CORS_ALLOWED_DOMAINS'
  },
  payloadLimit: {
    json: {
      doc: 'Body parser payload limit for json',
      format: String,
      default: '2mb',
      env: 'BODY_PARSER_PAYLOAD_LIMIT_JSON'
    }
  },
  dashboard: {
    url: {
      doc: 'Dashboard url',
      format: String,
      default: 'http://localhost:4002',
      env: 'DASHBOARD_URL'
    }
  },
  render: {
    gitCommit: {
      doc: 'Git commit hash',
      default: undefined,
      required: false,
      format: nonRequiredString,
      env: 'RENDER_GIT_COMMIT'
    },
    serviceName: {
      doc: 'Service name',
      format: String,
      default: 'crawler-service',
      env: 'RENDER_SERVICE_NAME'
    }
  },
  datadog: {
    enabled: {
      doc: 'Enable Datadog',
      format: 'Boolean',
      default: false,
      env: 'DD_ENABLED'
    },
    statsdHost: {
      doc: 'Datadog statsd host',
      format: String,
      default: 'localhost',
      env: 'DD_STATSD_HOST'
    },
    service: {
      doc: 'Datadog service',
      format: String,
      default: 'crawler-service',
      env: 'DD_SERVICE'
    },
    source: {
      doc: 'Datadog Source',
      format: nonRequiredString,
      default: 'render',
      env: 'DD_SOURCE'
    },
    apiKey: {
      doc: 'Datadog API Key',
      format: nonRequiredString,
      default: undefined,
      env: 'DATADOG_API_KEY'
    }
  },
  pusher: {
    appId: {
      doc: 'Pusher App ID',
      format: String,
      default: process.env.PUSHER_APP_ID, 
      env: 'PUSHER_APP_ID'
    },
    key: {
      doc: 'Pusher Key',
      format: String,
      default: process.env.PUSHER_KEY, 
      env: 'PUSHER_KEY'
    },
    secret: {
      doc: 'Pusher Secret',
      format: String,
      default: process.env.PUSHER_SECRET, 
      env: 'PUSHER_SECRET'
    },
    cluster: {
      doc: 'Pusher Cluster',
      format: String,
      default: process.env.PUSHER_CLUSTER, 
      env: 'PUSHER_CLUSTER'
    },
    useTLS: {
      doc: 'Pusher useTLS',
      format: Boolean,
      default: process.env.PUSHER_USE_TLS,
      env: 'PUSHER_USE_TLS'
    }
  },
  tokens: {
    minExpiresAt: {
      format: Number,
      default: 10,
      env: 'MIN_EXPIRES_AT'
    },
    maxExpiresAt: {
      format: Number,
      default: 86400,
      env: 'MAX_EXPIRES_AT'
    }
  },
})

function nonRequiredString(val: unknown): asserts val is undefined | string {
  if (val === undefined || typeof val === 'string') {
    return
  }
  throw new Error()
}

function isAppEnv(val: unknown): asserts val is AppEnv {
  if (
    typeof val === 'string' &&
    Object.values(AppEnv).includes(val as AppEnv)
  ) {
    return
  }
  throw new Error('Invalid App Env')
}

config.validate({ allowed: 'strict' })
