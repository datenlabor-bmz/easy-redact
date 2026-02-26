'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslations } from 'next-intl'
import type { RedactionRule } from '@/types'

function groupRules(rules: RedactionRule[]) {
  const groups: Record<string, RedactionRule[]> = {}
  for (const rule of rules) {
    const g = rule.group || 'Sonstige'
    if (!groups[g]) groups[g] = []
    groups[g].push(rule)
  }
  return groups
}

const ruleMatches = (a?: RedactionRule, b?: RedactionRule) =>
  !!a && !!b && a.title === b.title

function RuleTooltipContent({ rule }: { rule: RedactionRule }) {
  return (
    <div className='flex flex-col gap-1.5 text-xs'>
      {rule.reason && <p className='font-semibold text-foreground'>{rule.reason}</p>}
      {rule.reference && <p className='text-muted-foreground'>{rule.reference}</p>}
      {rule.full_text && <p className='text-muted-foreground leading-relaxed line-clamp-5'>{rule.full_text}</p>}
      {rule.url && (
        <a href={rule.url} target='_blank' rel='noopener noreferrer'
          className='flex items-center gap-1 text-primary hover:underline mt-0.5'
          onClick={e => e.stopPropagation()}>
          <ExternalLink className='h-3 w-3' /> Gesetzestext
        </a>
      )}
    </div>
  )
}

const CHEVRON_W = 16

function RuleItem({ rule, selected, onSelect, depth = 0 }: {
  rule: RedactionRule; selected: boolean; onSelect: (r: RedactionRule) => void; depth?: number
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div onClick={() => onSelect(rule)}
          style={{ paddingLeft: `${CHEVRON_W + depth * CHEVRON_W}px` }}
          className={`pr-3 py-1 rounded text-xs cursor-pointer transition-colors ${
            selected ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-muted/70'
          }`}>
          {rule.title}
        </div>
      </TooltipTrigger>
      {(rule.reason || rule.full_text) && (
        <TooltipContent side='right' sideOffset={8}
          className='bg-white text-foreground border shadow-lg max-w-72 p-3'
          arrowClassName='bg-white fill-white'>
          <RuleTooltipContent rule={rule} />
        </TooltipContent>
      )}
    </Tooltip>
  )
}

function GroupItem({ title, rules, expanded, onToggle, onSelect, selectedRule, depth = 0 }: {
  title: string; rules: RedactionRule[]; expanded: boolean
  onToggle: () => void; onSelect: (r: RedactionRule) => void; selectedRule?: RedactionRule
  depth?: number
}) {
  return (
    <div>
      <div onClick={onToggle}
        style={{ paddingLeft: `${depth * CHEVRON_W}px` }}
        className='flex items-center pr-3 py-1 rounded text-xs cursor-pointer hover:bg-muted/70 text-muted-foreground font-medium transition-colors'>
        <span className='w-4 shrink-0 flex items-center justify-center'>
          {expanded
            ? <ChevronDown className='h-3 w-3' />
            : <ChevronRight className='h-3 w-3' />}
        </span>
        {title}
      </div>
      {(expanded || rules.some(r => ruleMatches(r, selectedRule))) && (
        <div className='flex flex-col'>
          {rules.map((r, i) => (
            <RuleItem key={i} rule={r} selected={ruleMatches(r, selectedRule)}
              onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export interface RuleSelectorProps {
  rules: RedactionRule[]
  selectedRule?: RedactionRule
  onRuleSelect: (rule?: RedactionRule) => void
}

export function RuleSelector({ rules, selectedRule, onRuleSelect }: RuleSelectorProps) {
  const t = useTranslations('RuleSelector')
  const groups = groupRules(rules)
  const matchedGroup = selectedRule
    ? Object.entries(groups).find(([, rs]) => rs.some(r => ruleMatches(r, selectedRule)))?.[0] ?? null
    : null
  const [expandedGroup, setExpandedGroup] = useState<string | null>(matchedGroup)
  useEffect(() => { if (matchedGroup) setExpandedGroup(matchedGroup) }, [matchedGroup])

  return (
    <TooltipProvider delayDuration={400}>
      <div className='w-60 flex flex-col bg-white border rounded-lg shadow-lg py-1.5 text-sm select-none'>
        <p className='text-[10px] text-muted-foreground px-3 pt-1 pb-1.5 font-semibold uppercase tracking-wider'>
          {t('label')}
        </p>
        <div className='flex flex-col px-1.5'>
          {Object.entries(groups).map(([group, groupRules]) =>
            groupRules.length === 1 ? (
              <RuleItem key={group} rule={groupRules[0]}
                selected={ruleMatches(groupRules[0], selectedRule)}
                onSelect={onRuleSelect} depth={0} />
            ) : (
              <GroupItem key={group} title={group} rules={groupRules}
                expanded={expandedGroup === group}
                onToggle={() => setExpandedGroup(expandedGroup === group ? null : group)}
                onSelect={onRuleSelect} selectedRule={selectedRule} depth={0} />
            )
          )}
        </div>
        <div className='mx-1.5 mt-1 border-t pt-1'>
          <div onClick={() => onRuleSelect(undefined)}
            style={{ paddingLeft: `${CHEVRON_W}px` }}
            className={`pr-3 py-1 rounded text-xs cursor-pointer italic transition-colors text-muted-foreground ${
              !selectedRule ? 'bg-muted/70' : 'hover:bg-muted/70'
            }`}>
            {t('noRule')}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
