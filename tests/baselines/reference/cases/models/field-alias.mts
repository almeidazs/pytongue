/* pytongue */
interface Event {
  type: string;
  startsAt: string;
}
declare namespace Event {
  type Input = Event;
}
export type { Event };
export {};
export type { Event as $py$Event };
