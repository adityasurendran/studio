export function logError(message: string, ...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(message, ...args);
  }
  // TODO: Integrate with remote logging service (e.g., Sentry)
}

export function logWarn(message: string, ...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(message, ...args);
  }
}

export function logInfo(message: string, ...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  }
} 