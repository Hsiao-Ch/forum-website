export interface commentType {
    authorAvatar: any;
    id: number;
    content: string;
    createdAt: string;
    parentId: number | null;
    root: number | null;
    isMine: boolean;
    isLocked: boolean;
    avatar: string;
    authorName: string;
    authorGroupName: string;
    authorGroupColor: string;
    isLiked: boolean;
    likesCount: number;
  }
  