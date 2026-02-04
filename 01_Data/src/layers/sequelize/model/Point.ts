export type Position = number[];

// matching GeoJSON Point type
export interface Point {
  type: 'Point';
  coordinates: Position;
}
