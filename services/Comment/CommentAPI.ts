// services/Comment/CommentAPI.ts
import API from '@/system/API';
import { Response } from '@/lib/types/requestType';
import { commentType } from '@/lib/types/commentType';

const BASE_URL = '/comment';

const CommentAPI = {
  get: (postId: number, page: number): Promise<Response<commentType[]>> => {
    return API.get(`${BASE_URL}`, {
      params: { post: postId, page: page }
    });
  },

  create: (data: {
    post: number;
    parent?: number | null;
    content: string;
  }): Promise<Response<{ comment_id: number }>> => {
    return API.post(BASE_URL, data);
  },
  update: (id: number, content: string): Promise<Response<unknown>> => {
    return API.patch(`/comment/${id}`, { content });
  },

  delete: (id: number): Promise<Response<unknown>> => {
    return API.patch(`/comment/${id}`, { isLocked: true });
  },
  
  like: (comment_id: string): Promise<Response<unknown>> => {
    return API.post(`/comment/${comment_id}/like/`);
  },
};

export default CommentAPI;
