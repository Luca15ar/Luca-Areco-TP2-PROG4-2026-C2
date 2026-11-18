import { describe, expect, it } from 'vitest';
import { RelativeTimePipe } from './relative-time.pipe';
import { TruncateWordsPipe } from './truncate-words.pipe';
import { UserRoleBadgePipe } from './user-role-badge.pipe';

describe('Custom Pipes', () => {
  describe('RelativeTimePipe', () => {
    const pipe = new RelativeTimePipe();

    it('debe retornar cadena vacía para valores nulos o inválidos', () => {
      expect(pipe.transform(null)).toBe('');
      expect(pipe.transform(undefined)).toBe('');
      expect(pipe.transform('fecha-invalida')).toBe('');
    });

    it('debe retornar "Hace unos instantes" para eventos recientes', () => {
      const now = new Date();
      expect(pipe.transform(now)).toBe('Hace unos instantes');
    });

    it('debe retornar minutos calculados', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(pipe.transform(date)).toBe('Hace 5 minutos');
    });

    it('debe retornar horas calculadas', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(pipe.transform(date)).toBe('Hace 2 horas');
    });

    it('debe retornar "Ayer" para fechas de hace 24-48 horas', () => {
      const date = new Date(Date.now() - 25 * 60 * 60 * 1000);
      expect(pipe.transform(date)).toBe('Ayer');
    });
  });

  describe('TruncateWordsPipe', () => {
    const pipe = new TruncateWordsPipe();

    it('debe retornar cadena vacía para valores nulos o vacíos', () => {
      expect(pipe.transform(null)).toBe('');
      expect(pipe.transform('')).toBe('');
    });

    it('debe respetar textos que no superan el límite de palabras', () => {
      const text = 'Una historia breve';
      expect(pipe.transform(text, 5)).toBe('Una historia breve');
    });

    it('debe truncar en el límite exacto de palabras y agregar sufijo', () => {
      const text = 'Uno dos tres cuatro cinco seis';
      expect(pipe.transform(text, 3, '...')).toBe('Uno dos tres...');
    });
  });

  describe('UserRoleBadgePipe', () => {
    const pipe = new UserRoleBadgePipe();

    it('debe transformar administrador a Administrador', () => {
      expect(pipe.transform('administrador')).toBe('Administrador');
      expect(pipe.transform('ADMINISTRADOR')).toBe('Administrador');
    });

    it('debe transformar usuario o cualquier otro rol a Lector', () => {
      expect(pipe.transform('usuario')).toBe('Lector');
      expect(pipe.transform(null)).toBe('Lector');
    });
  });
});
