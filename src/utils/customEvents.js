export const createCustomEvent = (eventName, detail = {}) => {
    return new CustomEvent(eventName, { detail });
  };
  