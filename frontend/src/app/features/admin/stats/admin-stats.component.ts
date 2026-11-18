import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  CommentsByPostStat,
  CommentsTimelineStat,
  PostsByUserStat,
} from '../../../core/services/admin.service';

export type RangePreset = '7d' | '30d' | '90d' | 'all' | 'custom';

interface DonutSlice {
  title: string;
  count: number;
  percentage: number;
  strokeDasharray: string;
  strokeDashoffset: number;
  color: string;
}

const PALETTE = [
  '#fb7185', // Rose/Accent
  '#be185d', // Primary
  '#38bdf8', // Sky
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-stats.component.html',
  styleUrl: './admin-stats.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStatsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Rango de fechas
  readonly selectedPreset = signal<RangePreset>('30d');
  readonly customStartDate = signal<string>('');
  readonly customEndDate = signal<string>('');

  // Clave para reiniciar animaciones CSS
  readonly animationKey = signal<number>(0);

  // Datos de las estadísticas
  readonly postsByUser = signal<PostsByUserStat>({ totalPosts: 0, users: [] });
  readonly commentsTimeline = signal<CommentsTimelineStat>({
    totalComments: 0,
    timeline: [],
  });
  readonly commentsByPost = signal<CommentsByPostStat>({
    totalComments: 0,
    posts: [],
  });

  // Gráfico 1: Barras calculadas
  readonly maxPostsCount = computed(() => {
    const list = this.postsByUser().users;
    if (list.length === 0) return 1;
    return Math.max(...list.map((u) => u.count), 1);
  });

  // Gráfico 2: Línea temporal calculada
  readonly maxTimelineCount = computed(() => {
    const list = this.commentsTimeline().timeline;
    if (list.length === 0) return 1;
    return Math.max(...list.map((t) => t.count), 1);
  });

  readonly timelinePoints = computed(() => {
    const list = this.commentsTimeline().timeline;
    if (list.length === 0) return [];

    const max = this.maxTimelineCount();
    const width = 500;
    const height = 180;
    const padding = 30;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    const step = list.length > 1 ? availableWidth / (list.length - 1) : availableWidth / 2;

    return list.map((item, index) => {
      const x = padding + (list.length === 1 ? availableWidth / 2 : index * step);
      const ratio = item.count / max;
      const y = height - padding - ratio * availableHeight;
      return {
        x,
        y,
        date: item.date,
        count: item.count,
      };
    });
  });

  readonly lineSvgPath = computed(() => {
    const pts = this.timelinePoints();
    if (pts.length === 0) return '';
    return pts.reduce(
      (path, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`),
      '',
    );
  });

  readonly areaSvgPath = computed(() => {
    const pts = this.timelinePoints();
    if (pts.length === 0) return '';
    const height = 180;
    const padding = 30;
    const bottomY = height - padding;
    const line = this.lineSvgPath();
    const lastPt = pts[pts.length - 1];
    const firstPt = pts[0];
    return `${line} L ${lastPt.x} ${bottomY} L ${firstPt.x} ${bottomY} Z`;
  });

  // Gráfico 3: Rebanadas de la dona
  readonly donutSlices = computed<DonutSlice[]>(() => {
    const posts = this.commentsByPost().posts;
    const total = this.commentsByPost().totalComments;
    if (posts.length === 0 || total === 0) return [];

    const radius = 60;
    const circumference = 2 * Math.PI * radius; // ~376.99
    let accumulatedOffset = 0;

    return posts.map((post, idx) => {
      const percentage = (post.count / total) * 100;
      const strokeLength = (post.count / total) * circumference;
      const strokeSpace = circumference - strokeLength;
      const slice: DonutSlice = {
        title: post.title,
        count: post.count,
        percentage: Math.round(percentage),
        strokeDasharray: `${strokeLength} ${strokeSpace}`,
        strokeDashoffset: -accumulatedOffset,
        color: PALETTE[idx % PALETTE.length],
      };
      accumulatedOffset += strokeLength;
      return slice;
    });
  });

  ngOnInit(): void {
    this.applyPreset('30d');
  }

  applyPreset(preset: RangePreset): void {
    this.selectedPreset.set(preset);
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined = now;

    if (preset === '7d') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === '30d') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (preset === '90d') {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (preset === 'all') {
      start = undefined;
      end = undefined;
    }

    if (start) {
      this.customStartDate.set(start.toISOString().substring(0, 10));
    } else {
      this.customStartDate.set('');
    }

    if (end) {
      this.customEndDate.set(end.toISOString().substring(0, 10));
    } else {
      this.customEndDate.set('');
    }

    this.fetchStats();
  }

  fetchStats(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const start = this.customStartDate() || undefined;
    const end = this.customEndDate() || undefined;

    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed === 3) {
        this.isLoading.set(false);
        this.animationKey.update((k) => k + 1);
      }
    };

    this.adminService.getPostsByUser(start, end).subscribe({
      next: (data) => {
        this.postsByUser.set(data);
        checkDone();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Error al cargar estadísticas.');
        checkDone();
      },
    });

    this.adminService.getCommentsTimeline(start, end).subscribe({
      next: (data) => {
        this.commentsTimeline.set(data);
        checkDone();
      },
      error: () => checkDone(),
    });

    this.adminService.getCommentsByPost(start, end).subscribe({
      next: (data) => {
        this.commentsByPost.set(data);
        checkDone();
      },
      error: () => checkDone(),
    });
  }

  onCustomDateChange(): void {
    this.selectedPreset.set('custom');
    if (this.customStartDate() && this.customEndDate()) {
      this.fetchStats();
    }
  }
}
