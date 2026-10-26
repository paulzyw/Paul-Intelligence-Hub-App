import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FaqItem {
  id: string;
  number: string;
  question: string;
  content: {
    paragraphs?: string[];
    bullets?: { label: string; text: string }[];
    conclusion?: string;
  };
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-01',
    number: '01',
    question: 'What is RevOS?',
    content: {
      paragraphs: [
        'RevOS is a Revenue Operating System designed to help sales professionals and revenue teams approach complex revenue challenges through structured methodologies and evidence-informed AI reasoning.',
        'Its capabilities span go-to-market strategy, lead qualification, and opportunity assessment. By organizing business context, evaluating available evidence, identifying gaps and risks, and generating actionable recommendations, RevOS helps users make more structured and informed revenue decisions.',
      ],
    },
  },
  {
    id: 'faq-02',
    number: '02',
    question: 'How is RevOS different from a CRM?',
    content: {
      paragraphs: [
        'A CRM primarily helps businesses manage customer relationships, sales activities, and related records. RevOS focuses on structuring revenue challenges, assessing available evidence, and supporting decisions about what to prioritize and do next.',
        'Rather than positioning itself as a replacement for every CRM function, RevOS provides a methodology-led approach to revenue strategy, qualification, and opportunity assessment. The two serve different purposes and may complement each other, depending on how a business organizes its revenue operations.',
      ],
    },
  },
  {
    id: 'faq-03',
    number: '03',
    question: 'What can I do with RevOS?',
    content: {
      paragraphs: ['RevOS brings together three core capability areas:'],
      bullets: [
        {
          label: 'GTMOS',
          text: 'Structure your go-to-market strategy, including target markets, ideal customer profiles, value propositions, messaging, and your broader revenue approach.',
        },
        {
          label: 'Lead Qualification',
          text: 'Assess MQLs, SQLs, and Opportunities through structured qualification criteria, available customer evidence, identified gaps, and recommended next steps.',
        },
        {
          label: 'Pipeline Assessment',
          text: 'Examine deal health, strengths, risks, competitive factors, and potential winning actions to support opportunity decisions.',
        },
      ],
      conclusion:
        'Together, these capabilities help revenue professionals move from complex business information toward more structured assessments and practical actions.',
    },
  },
  {
    id: 'faq-04',
    number: '04',
    question: 'How does RevOS use AI to support revenue decisions?',
    content: {
      paragraphs: [
        'RevOS combines structured revenue methodologies with AI reasoning to help users examine business context, interpret available information, identify relevant factors, and generate assessments and recommendations.',
        'The methodology provides the structure for the task, while AI reasoning helps analyze the information supplied within that structure. The resulting assessment can help users identify priorities, consider potential risks, and determine which questions or actions deserve attention.',
        "AI-generated findings should be reviewed in the context of the available evidence and the user's business judgment. RevOS is designed to support human decision-making, not eliminate the need for it.",
      ],
    },
  },
  {
    id: 'faq-05',
    number: '05',
    question: 'How does RevOS evaluate evidence and identify gaps?',
    content: {
      paragraphs: [
        'RevOS uses the information available within a structured assessment to help identify supporting evidence, potential risks, unanswered questions, and areas requiring further investigation.',
        'For example, during SQL Qualification, a sales professional can provide updated customer evidence across qualification dimensions such as business problem, metrics and success criteria, stakeholder alignment, buying process, and commercial readiness.',
        'The assessment can then highlight factors that support qualification, identify unresolved gaps, and recommend appropriate follow-up actions.',
        'The usefulness of an assessment depends on the relevance, completeness, and reliability of the information provided.',
      ],
    },
  },
  {
    id: 'faq-06',
    number: '06',
    question: 'Who is RevOS designed for?',
    content: {
      paragraphs: [
        'RevOS is designed for sales professionals and revenue teams who need a more structured way to approach revenue strategy, qualification, and opportunity decisions.',
        'Its capability areas can support different stages of revenue work—from developing a go-to-market approach and evaluating leads to examining opportunity risks and determining potential next actions.',
        "The most relevant use cases depend on the user's role, the business challenge being addressed, and the RevOS capabilities available to them.",
      ],
    },
  },
  {
    id: 'faq-07',
    number: '07',
    question: 'What information do I need to get started?',
    content: {
      paragraphs: [
        'The information you need depends on the RevOS capability you want to use.',
        'A go-to-market assessment may require information about your target market, ideal customer profile, value proposition, and business objectives.',
        'Lead Qualification may require customer context, evidence of business needs, qualification details, and information about the buying process.',
        'Pipeline Assessment may require details about the deal, stakeholders, competition, risks, and potential paths to winning.',
        'Providing relevant and specific information helps RevOS develop a more useful assessment. Where information is missing or uncertain, the appropriate next step may be to identify the gap and gather additional evidence rather than assume that the missing information is known.',
      ],
    },
  },
  {
    id: 'faq-08',
    number: '08',
    question: 'How can I start using RevOS?',
    content: {
      paragraphs: [
        'Start by exploring the RevOS capability most relevant to your current revenue challenge. Whether you want to structure your go-to-market strategy, qualify a lead, or assess opportunity pipeline, begin with the business context and information available to you.',
        'Follow the workflow provided by the selected capability, review the resulting assessment and recommendations, and use the identified gaps to guide further investigation and action.',
      ],
    },
  },
];

export function FaqSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.08, rootMargin: '40px 0px 40px 0px' }
    );

    const el = sectionRef.current;
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      aria-label="Frequently Asked Questions"
      className="relative w-full py-24 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 bg-bg-primary border-t border-border/60 transition-colors duration-400"
    >
      <div
        className="max-w-6xl mx-auto transition-all duration-700 ease-out"
        style={{
          opacity: isVisible || prefersReducedMotion ? 1 : 0,
          transform: isVisible || prefersReducedMotion ? 'translateY(0)' : 'translateY(18px)',
        }}
      >
        {/* 1. EYEBROW, H2 & SUPPORTING PARAGRAPH */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16 lg:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold tracking-[0.18em] uppercase text-accent shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
            Questions About RevOS?
          </h2>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed pt-1 max-w-2xl mx-auto">
            RevOS brings proven structured methodologies and AI-powered reasoning to revenue challenges. Explore how the platform works, what its capabilities cover, and how it can support your revenue decision-making process.
          </p>
        </div>

        {/* 2. SINGLE-COLUMN FAQ ACCORDION */}
        <div className="bg-bg-surface border border-border/80 rounded-2xl shadow-xs divide-y divide-border/60 overflow-hidden">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            const headingId = `faq-title-${item.id}`;
            const panelId = `faq-content-${item.id}`;

            return (
              <div key={item.id} className="transition-colors duration-200">
                <button
                  type="button"
                  id={headingId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full text-left flex items-center justify-between gap-4 py-[14px] sm:py-[16px] px-5 sm:px-8 min-h-[48px] group focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px] transition-colors duration-200 ${
                    isOpen
                      ? 'bg-accent/10 hover:bg-accent/15'
                      : 'bg-transparent hover:bg-accent/10'
                  }`}
                >
                  <span className="flex items-center gap-3 sm:gap-4 pr-2">
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-accent shrink-0 select-none">
                      FAQ {item.number}
                    </span>
                    <span className="text-text-secondary select-none font-light">—</span>
                    <span className="text-base sm:text-lg font-semibold text-text-primary tracking-tight transition-colors duration-180 group-hover:text-accent leading-snug">
                      {item.question}
                    </span>
                  </span>

                  {/* Smooth rotating plus/minus icon indicator */}
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-180 border ${
                      isOpen
                        ? 'border-accent/30 bg-accent/10 text-accent'
                        : 'border-border/80 bg-bg-primary/60 text-text-secondary group-hover:text-accent group-hover:border-accent/40'
                    }`}
                    aria-hidden="true"
                  >
                    <Plus
                      className="w-4 h-4 transition-transform duration-250 ease-in-out"
                      style={{
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}
                    />
                  </span>
                </button>

                {/* Animated Accordion Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={headingId}
                      initial={prefersReducedMotion ? { opacity: 1, height: 'auto' } : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={prefersReducedMotion ? { opacity: 0, height: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-8 pb-6 sm:pb-7 pt-1 text-sm sm:text-base text-text-secondary leading-tight space-y-3.5 border-t border-border/30 bg-bg-surface">
                        {item.content.paragraphs?.map((p, idx) => (
                          <p key={idx}>{p}</p>
                        ))}

                        {item.content.bullets && (
                          <ul className="space-y-2.5 my-2 pl-2">
                            {item.content.bullets.map((b, idx) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <span className="text-accent font-bold mt-1 text-base leading-none shrink-0">•</span>
                                <span>
                                  <strong className="font-semibold text-text-primary">{b.label}:</strong>{' '}
                                  {b.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {item.content.conclusion && (
                          <p className="pt-1">{item.content.conclusion}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* 3. COMPACT CLOSING STATEMENT */}
        <div className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-2xl bg-bg-surface border border-accent/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Ready to rethink your revenue decisions?
            </h3>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Explore how RevOS can help you turn complex revenue challenges into structured action.
            </p>
          </div>
          <a
            href="#revos-platform"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-accent text-white shadow-xs hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-all duration-180 shrink-0"
          >
            <span>Explore Platform</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
