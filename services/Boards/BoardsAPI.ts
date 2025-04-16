import API from '../../system/API';
import { BoardItem, CreatableBoardItem } from '@/lib/types/boardsType';
import { Response } from '@/lib/types/requestType';

const BASE_URL = '/boards';

const BoardsAPI = {
  getList: (): Promise<Response<BoardItem[]>> =>
    API.get(`${BASE_URL}`),
  listCreatableBoards: (): Promise<Response<CreatableBoardItem[]>> =>
    API.get(BASE_URL + '/creatable'),
};

export default BoardsAPI;