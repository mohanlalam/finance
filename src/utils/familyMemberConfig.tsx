import React from 'react';
import { User, Users } from '../components/icons/AppIcons';

export interface FamilyMemberConfig {
  icon: React.ReactNode;
  bg: string;
  text: string;
}

export const familyMemberConfigs: Record<string, FamilyMemberConfig> = {
  rammohan: {
    icon: <User size={12} />,
    bg: 'bg-blue-500/15 dark:bg-blue-400/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  personal: {
    icon: <User size={12} />,
    bg: 'bg-blue-500/15 dark:bg-blue-400/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  padmavathi: {
    icon: <User size={12} />,
    bg: 'bg-emerald-500/15 dark:bg-emerald-400/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  mother: {
    icon: <User size={12} />,
    bg: 'bg-emerald-500/15 dark:bg-emerald-400/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  sai_laxmi: {
    icon: <Users size={12} />,
    bg: 'bg-purple-500/15 dark:bg-purple-400/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
  sailaxmi: {
    icon: <Users size={12} />,
    bg: 'bg-purple-500/15 dark:bg-purple-400/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
  wife: {
    icon: <Users size={12} />,
    bg: 'bg-purple-500/15 dark:bg-purple-400/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
};

export function getFamilyMemberConfig(name: string): FamilyMemberConfig {
  const normalized = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.includes('rammohan') || normalized.includes('ram') || normalized === 'personal') {
    return familyMemberConfigs.rammohan;
  }
  if (normalized.includes('padmavathi') || normalized === 'mother') {
    return familyMemberConfigs.padmavathi;
  }
  if (normalized.includes('sailaxmi') || normalized.includes('sai') || normalized === 'wife') {
    return familyMemberConfigs.sai_laxmi;
  }
  return (
    familyMemberConfigs[normalized] ?? {
      icon: <User size={12} />,
      bg: 'bg-blue-500/15 dark:bg-blue-400/20',
      text: 'text-blue-600 dark:text-blue-400',
    }
  );
}
