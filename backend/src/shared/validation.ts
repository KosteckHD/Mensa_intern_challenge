import { BadRequestException } from '@nestjs/common';

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} is required.`);
  }

  return value.trim();
}

export function optionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be a string.`);
  }

  return value.trim();
}

export function optionalEmail(value: unknown): string | null {
  const email = optionalString(value, 'customerEmail');

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException('customerEmail must be a valid email.');
  }

  return email;
}

export function requireNonNegativeInteger(
  value: unknown,
  field: string,
): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new BadRequestException(`${field} must be a non-negative integer.`);
  }

  return Number(value);
}

export function requirePositiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new BadRequestException(`${field} must be a positive integer.`);
  }

  return Number(value);
}

export function optionalDate(value: unknown, field: string): Date | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be an ISO date string.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} must be a valid ISO date string.`);
  }

  return date;
}
