import { describe, expect, it, vi } from 'vitest';
import { StatsService } from './stats.service.js';

describe('StatsService', () => {
  const mockPostModel: any = {
    aggregate: vi.fn(),
  };

  const service = new StatsService(mockPostModel);

  it('debe calcular publicaciones por usuario correctamente', async () => {
    mockPostModel.aggregate.mockResolvedValueOnce([
      { userId: '1', username: 'lucaa', name: 'Luca Areco', count: 5 },
      { userId: '2', username: 'juanp', name: 'Juan Perez', count: 3 },
    ]);

    const result = await service.getPostsByUser({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    expect(result.totalPosts).toBe(8);
    expect(result.users).toHaveLength(2);
    expect(result.users[0].username).toBe('lucaa');
  });

  it('debe calcular evolución de comentarios en el tiempo', async () => {
    mockPostModel.aggregate.mockResolvedValueOnce([
      { date: '2026-11-10', count: 2 },
      { date: '2026-11-11', count: 4 },
    ]);

    const result = await service.getCommentsTimeline({});

    expect(result.totalComments).toBe(6);
    expect(result.timeline).toHaveLength(2);
  });

  it('debe calcular comentarios por publicación', async () => {
    mockPostModel.aggregate.mockResolvedValueOnce([
      { postId: 'p1', title: 'Primera publicación', count: 7 },
    ]);

    const result = await service.getCommentsByPost({});

    expect(result.totalComments).toBe(7);
    expect(result.posts[0].title).toBe('Primera publicación');
  });
});
