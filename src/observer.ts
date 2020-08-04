interface Subscriber {
  update: (event: { type: string; data: any }) => void;
}

interface Observer {
  subscribers: Subscriber[];
  subscribe: (s: Subscriber) => void;
  notifySubscribers: (event: { type: string; data: any }) => void;
}
