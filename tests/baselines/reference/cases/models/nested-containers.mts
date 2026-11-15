/* pytongue */
interface Tag {
  label: string;
}
declare namespace Tag {
  type Input = Tag;
}
interface Post {
  tags: Tag[];
  by_name: Record<string, Tag>;
  pinned: Tag | null;
}
declare namespace Post {
  interface Input {
    tags: Tag.Input[];
    by_name: Record<string, Tag.Input>;
    pinned?: Tag.Input | null;
  }
}
export type { Tag, Post };
export {};
export type { Tag as $py$Tag, Post as $py$Post };
