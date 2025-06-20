import Layout from '@/components/layout/Layout';
import Banner from '@/components/common/Banner';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Paper,
  InputBase,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
} from '@mui/material';
import { Search, Groups, List, ThumbUp } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { useLoading } from '@/lib/context/LoadingContext';
import { BoardItem, FilterType } from '@/lib/types/boardsType';
import BoardsAPI from '@/services/Boards/BoardsAPI';
import { useEffect, useState } from 'react';
import Sticker from '@/public/images/sticker.jpg';
import styles from '@/styles/pages/BoardPage.module.scss';

const BoardPage = () => {
  const router = useRouter();
  const { register, watch } = useForm();
  const searchTerm = watch('searchTerm')?.trim() || '';
  const { setLoading } = useLoading();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const showToast = (msg: string) => setToast({ open: true, message: msg });

  const [boards, setBoards] = useState<BoardItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchFollow = async (boardId: string) => {
    const currentBoard = boards.find(board => board.id === boardId);
    if (!currentBoard) return;

    setBoards(prevBoards =>
      prevBoards.map(board =>
        board.id === boardId
          ? {
            ...board,
            isFollow: !board.isFollow,
            // 根据追踪状态调整人数
            followerCount: board.isFollow
              ? Math.max(0, (board.followerCount || 0) - 1)
              : (board.followerCount || 0) + 1
          }
          : board
      )
    );

    try {
      const res = await BoardsAPI.follow(boardId);
      showToast(res.message ?? "");
    } catch (error) {
      console.error('Follow API failed:', error);
      setBoards(prevBoards =>
        prevBoards.map(board =>
          board.id === boardId
            ? {
              ...board,
              isFollow: currentBoard.isFollow,
              followerCount: currentBoard.followerCount
            }
            : board
        )
      );
      showToast("操作失败，请重试");
    }
  }

  /** 取得看板列表 */
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await BoardsAPI.getList();
        const mapped: BoardItem[] = res.data.map(b => ({
          id: b.id,
          title: b.name,
          description: b.description,
          colors: b.color,
          avatar: b.avatar || Sticker,
          moderator: b.moderator,
          moderatorAvatar: b.moderatorAvatar || Sticker,
          moderatorGroupColor: b.moderatorGroupColor || "#000000",
          followers: b.followers || 0,
          postsCount: b.postsCount || 0,
          // 修复：使用API返回的isFollowed字段
          isFollow: b.isFollowed || false,
          url: b.url,
          // 修复：使用API返回的followerCount字段
          followerCount: b.followerCount || 0
        }));
        setBoards(mapped);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.log(err?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** 篩選看板 */
  const visibleBoards = boards
    .filter(b => {
      if (filter === 'followed') return b.isFollow;
      if (filter === 'unfollowed') return !b.isFollow;
      return true;
    })
    .filter(b => !searchTerm || b.title.includes(searchTerm));

  /** 數字格式化 */
  const fmt = (n: number) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : n.toString();

  return (
    <Layout title="所有看板">
      <Banner title="所有看板" content="探索不同主題的技術社群，加入感興趣的看板參與討論" icon={List} />

      {/* 搜尋與篩選 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 4,
          alignItems: { xs: 'stretch', md: 'center' }
        }}
      >
        <Paper
          elevation={2}
          sx={{
            p: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            maxWidth: { xs: '100%', md: 400 },
            borderRadius: 2
          }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="搜尋看板..."
            {...register('searchTerm')}
          />
          <IconButton color="primary">
            <Search />
          </IconButton>
        </Paper>

        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, f) => f && setFilter(f as FilterType)}
          sx={{
            '& .MuiToggleButton-root': {
              border: 1,
              borderColor: 'divider',
              px: 2
            }
          }}
        >
          <ToggleButton value="all">全部看板</ToggleButton>
          <ToggleButton value="followed">已追蹤</ToggleButton>
          <ToggleButton value="unfollowed">未追蹤</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 看板清單 */}
      {visibleBoards.length === 0 ? (
        <Box sx={{ mt: 8, textAlign: 'center', py: 6 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
            沒有找到符合條件的看板
          </Typography>
          <Typography color="text.secondary">
            嘗試更改搜尋條件或查看全部看板
          </Typography>
        </Box>
      ) : (
        <Grid className={styles.contentWrap}>
          {visibleBoards.map(b => (
            <Grid key={b.id}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  minHeight: { xs: 380, md: 420 },
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                  },
                }}
              >
                <Box
                  onClick={() => { router.push(`/forum/${b.url}`); }}
                  sx={{
                    cursor: 'pointer',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 2, md: 3 } }}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Avatar
                          src={typeof b.avatar === 'string' ? b.avatar : b.avatar?.src}
                          sx={{
                            width: isMobile ? 60 : 80,
                            height: isMobile ? 60 : 80,
                            mx: 'auto',
                            mb: 2,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                          }}
                        />
                      </Box>
                      <Box sx={{ px: 1.5, mt: 1 }}>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            align="center"
                            sx={{
                              fontSize: { xs: '0.95rem', md: '1.05rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'inline-block',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              color: b.colors || theme.palette.primary.main,
                              backgroundColor: b.colors ? `${b.colors}1A` : 'rgba(211, 47, 47, 0.1)',
                              py: 0.6,
                              px: 1.5,
                              borderRadius: 1
                            }}
                          >
                            {b.title}
                          </Typography>
                        </Box>

                        {/* 版主資訊 */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: b.moderatorGroupColor + "10",
                              borderRadius: 10,
                              py: 1,
                              px: 2,
                            }}
                          >
                            <Avatar
                              src={typeof b.moderatorAvatar === 'string' ? b.moderatorAvatar : b.moderatorAvatar?.src}
                              sx={{
                                width: 28,
                                height: 28,
                                border: '2px solid',
                                borderColor: b.moderatorGroupColor || theme.palette.primary.main,
                              }}
                            />
                            <Box sx={{ ml: 1.5, overflow: 'hidden' }}>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: b.moderatorGroupColor || theme.palette.primary.main,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  fontSize: '0.875rem',
                                  maxWidth: '120px'
                                }}
                              >
                                {b.moderator || '未指定'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* 看板描述 */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="left"
                          sx={{
                            fontSize: { xs: '0.8rem', md: '0.875rem' },
                            height: '50',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word'
                          }}
                        >
                          {b.description}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 'auto' }}>
                      <Divider sx={{ my: 2 }} />
                      <Box display="flex" justifyContent="space-around">
                        <Tooltip title="成員數">
                          <Box display="flex" alignItems="center" color="text.secondary">
                            <Groups fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="caption" fontWeight={500}>
                              {fmt(b.followerCount ?? 0)}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>

                      {/* 追蹤按鈕 */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchFollow(b.id);
                        }}
                        fullWidth
                        variant={b.isFollow ? 'contained' : 'outlined'}
                        size="medium"
                        startIcon={b.isFollow ? <ThumbUp fontSize="small" /> : null}
                        sx={{
                          mt: 2.5,
                          mb: 0.5,
                          textTransform: 'none',
                          borderRadius: 1.5,
                          py: 1
                        }}>
                        {b.isFollow ? '已追蹤' : '追蹤'}
                      </Button>
                    </Box>
                  </CardContent>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ open: false, message: "" })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          sx={{
            width: '100%',
            borderRadius: 2
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default BoardPage;