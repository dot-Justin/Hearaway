declare module 'shapefile';

declare module 'rbush' {
  interface RBushBBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }

  export default class RBush<T extends RBushBBox> {
    constructor(maxEntries?: number);
    insert(item: T): this;
    load(items: T[]): this;
    search(bbox: RBushBBox): T[];
    all(): T[];
  }
}

