// context/EventContext.js
import { createContext, useContext, useState, useCallback } from 'react';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const [listeners, setListeners] = useState({});

  const addEventListener = useCallback((event, callback) => {
    setListeners((prevListeners) => ({
      ...prevListeners,
      [event]: [...(prevListeners[event] || []), callback],
    }));
  }, []);

  const removeEventListener = useCallback((event, callback) => {
    setListeners((prevListeners) => ({
      ...prevListeners,
      [event]: (prevListeners[event] || []).filter((listener) => listener !== callback),
    }));
  }, []);

  const dispatchEvent = useCallback((event) => {
    const eventListeners = listeners[event.type] || [];
    eventListeners.forEach((listener) => listener(event));
  }, [listeners]);

  return (
    <EventContext.Provider value={{ addEventListener, removeEventListener, dispatchEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => useContext(EventContext);
