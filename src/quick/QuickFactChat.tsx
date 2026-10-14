import React, { useEffect, useRef, useState } from 'react';
import type { MissingFactQuestion } from '../engine/missingFacts';
import { cleanUserFacts, USER_FACT_MAX_CHARS, USER_FACTS_MAX } from '../engine/missingFacts';
import {
  chatFacts,
  CLOSING_QUESTION,
  FactChat,
  FactChatContext,
  FACT_CHAT_MAX_QUESTIONS,
  nextFactChatStep,
  questionsAsked,
  SKIPPED_ANSWER,
  startFactChat,
} from '../engine/factChat';
import { findPageAnswer, FROM_PAGE_PREFIX } from '../engine/pageAnswers';
import GrowingField from './GrowingField';
import { TIPS } from './tips';

/**
 * "Make it stronger" as a chat (see engine/factChat.ts): CopyZap asks one
 * question at a time and decides the next one from the answer, and ends with an
 * open "anything else?". Below the chat, the facts CopyZap will use: the user
 * can take any out, and add one in their own words at any time. Generating
 * never waits for the chat.
 *
 * Under a question, when the user's page already holds an answer (a figure in
 * a testimonial, say), the passage is shown word for word with "Use this",
 * which puts it in the answer field (see engine/pageAnswers.ts). The user sends
 * it or not; nothing is used on its own.
 */
interface QuickFactChatProps {
  /** null while Quick is still looking for what is missing. */
  questions: MissingFactQuestion[] | null;
  chat: FactChat;
  setChat: React.Dispatch<React.SetStateAction<FactChat>>;
  context: FactChatContext;
  /** True while the questions are asked again after a change (the check screen is locked meanwhile). */
  updating?: boolean;
}

const FIELD =
  'w-full min-h-[44px] px-3.5 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-500';
const PRIMARY =
  'inline-flex items-center justify-center min-h-[44px] px-5 bg-primary-500 hover:bg-primary-400 text-white font-semibold ' +
  'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
const SECONDARY =
  'inline-flex items-center justify-center min-h-[44px] px-4 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500';
const LINK =
  'underline underline-offset-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500';

/** Longest wait for the page check under a question; then the answer field unlocks without a passage. */
const PAGE_CHECK_MAX_MS = 10000;

const QuickFactChat: React.FC<QuickFactChatProps> = ({ questions, chat, setChat, context, updating }) => {
  // The chat starts as soon as the questions are known: its first question is the first one found.
  useEffect(() => {
    if (questions !== null && chat.turns.length === 0) setChat(startFactChat(questions));
  }, [questions, chat.turns.length, setChat]);

  // For the question on screen: look in the user's page for a passage that answers it. One look per
  // question; a question asked again (after "Start the chat again") gets the same answer from memory.
  // While Quick looks, the answer field and the buttons are locked (pageCheck below), so the user cannot
  // answer or skip before the passage can appear. After PAGE_CHECK_MAX_MS the field unlocks anyway.
  const found = useRef(new Map<string, string>());
  const inFlight = useRef(new Set<string>());
  const lastIndex = chat.turns.length - 1;
  const lastQuestion = chat.turns[lastIndex];
  useEffect(() => {
    if (!lastQuestion || lastQuestion.from !== 'copyzap' || lastQuestion.fromPage !== undefined) return;
    if (lastQuestion.text === CLOSING_QUESTION) return;
    const text = lastQuestion.text;
    const index = lastIndex;
    const setPassage = (passage: string) =>
      setChat(current => ({
        ...current,
        turns: current.turns.map((turn, at) =>
          at === index && turn.from === 'copyzap' && turn.text === text && turn.fromPage === undefined
            ? { ...turn, fromPage: passage }
            : turn
        ),
      }));
    const known = found.current.get(text);
    if (known !== undefined) {
      setPassage(known);
      return;
    }
    if (inFlight.current.has(text)) return;
    inFlight.current.add(text);
    const giveUp = new Promise<string>(resolve => setTimeout(() => resolve(''), PAGE_CHECK_MAX_MS));
    Promise.race([findPageAnswer(context.copy, text, context.user, context.sessionId, context.language), giveUp]).then(
      passage => {
        found.current.set(text, passage);
        inFlight.current.delete(text);
        setPassage(passage);
      }
    );
  }, [lastQuestion, lastIndex, context.copy, context.user, context.sessionId, context.language, setChat]);

  /** Adds the user's answer and asks CopyZap for the next step. A late reply for an older chat is ignored. */
  const answer = (text: string) => {
    if (chat.waiting || chat.done || questions === null) return;
    const sent: FactChat = {
      ...chat,
      draft: '',
      waiting: true,
      turns: [...chat.turns, { from: 'user', text }],
    };
    setChat(sent);
    // Facts added or taken out by hand while CopyZap was reading stay as the user left them.
    nextFactChatStep(context, questions, sent).then(next =>
      setChat(current =>
        current.turns === sent.turns
          ? {
              ...next,
              facts: next.facts.filter(fact => !current.removed.includes(fact)),
              added: current.added,
              removed: current.removed,
              draft: current.draft,
            }
          : current
      )
    );
  };

  const send = () => {
    // Enter in the field sends too: not while the page check runs.
    if (locked) return;
    const text = chat.draft.replace(/\s+/g, ' ').trim();
    if (text) answer(text);
  };
  const remove = (fact: string) =>
    setChat(current => ({
      ...current,
      facts: current.facts.filter(item => item !== fact),
      added: current.added.filter(item => item !== fact),
      removed: [...current.removed, fact],
    }));
  const finish = () => setChat(current => ({ ...current, done: true, waiting: false }));
  // A new chat keeps the facts the user added by hand.
  const restart = () => setChat(current => ({ ...startFactChat(questions ?? []), added: current.added }));

  // "Add a fact": straight into the list, exactly as typed.
  const [addDraft, setAddDraft] = useState('');
  const facts = chatFacts(chat);
  const full = facts.length >= USER_FACTS_MAX;
  const addFact = () => {
    const fact = cleanUserFacts([addDraft])[0];
    if (!fact || full) return;
    setChat(current => ({
      ...current,
      added: cleanUserFacts([...current.added, fact]),
      removed: current.removed.filter(item => item.toLowerCase() !== fact.toLowerCase()),
    }));
    setAddDraft('');
  };

  if (questions === null) {
    return (
      <p className="text-gray-600 dark:text-gray-400" aria-live="polite">
        {updating
          ? 'Updating the questions… The screen unlocks in a moment.'
          : 'Looking for what is missing… You can generate without waiting.'}
      </p>
    );
  }

  const asked = questionsAsked(chat.turns);
  const lastTurn = chat.turns[chat.turns.length - 1];
  const lastIsQuestion = lastTurn?.from === 'copyzap';
  const onClosing = lastIsQuestion && lastTurn.text === CLOSING_QUESTION;
  // Quick is still looking in the page for an answer to the question on screen: answering waits for it.
  const pageCheck = lastIsQuestion && !onClosing && lastTurn.fromPage === undefined && !chat.done;
  const locked = chat.waiting || pageCheck;

  return (
    <div className="flex flex-col gap-4">
      <ol className="m-0 p-0 list-none flex flex-col gap-3" aria-live="polite">
        {chat.turns.map((turn, index) =>
          turn.from === 'copyzap' ? (
            <li key={index} className="flex flex-col gap-0.5 border-l-2 border-primary-500 pl-3">
              <span className="sr-only">CopyZap asks:</span>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{turn.text}</p>
              {turn.example && <p className="text-gray-600 dark:text-gray-400">e.g. {turn.example}</p>}
              {turn.fromPage && index === chat.turns.length - 1 && !chat.done && (
                <div className="mt-1.5 flex flex-col gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2">
                  <p className="text-gray-600 dark:text-gray-400">Your page already says:</p>
                  <p className="text-gray-900 dark:text-gray-100 break-words">“{turn.fromPage}”</p>
                  <div>
                    <button
                      type="button"
                      onClick={() => setChat(current => ({ ...current, draft: `${FROM_PAGE_PREFIX} ${turn.fromPage}` }))}
                      disabled={chat.waiting}
                      data-tip={TIPS.factFromPage}
                      className={SECONDARY}
                    >
                      Use this
                    </button>
                  </div>
                </div>
              )}
            </li>
          ) : (
            <li
              key={index}
              className="self-end max-w-[85%] px-3.5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 break-words"
            >
              <span className="sr-only">You: </span>
              {turn.text === SKIPPED_ANSWER ? <span className="text-gray-600 dark:text-gray-400">Skipped</span> : turn.text}
            </li>
          )
        )}
      </ol>

      {chat.waiting && (
        <p className="text-gray-600 dark:text-gray-400" aria-live="polite">
          Reading your answer…
        </p>
      )}
      {!chat.waiting && pageCheck && (
        <p className="text-gray-600 dark:text-gray-400" aria-live="polite">
          Checking your page for an answer… a moment.
        </p>
      )}

      {!chat.done && lastIsQuestion && (
        <div className="flex flex-col gap-2">
          <label htmlFor="quick-fact-chat" className="sr-only">
            Your answer
          </label>
          <GrowingField
            id="quick-fact-chat"
            value={chat.draft}
            maxLength={USER_FACT_MAX_CHARS}
            onChange={draft => setChat(current => ({ ...current, draft }))}
            onEnter={send}
            disabled={locked}
            placeholder="Your answer, as it is true for you"
            tip={TIPS.factChat}
            className={FIELD}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={send} disabled={locked || !chat.draft.trim()} className={PRIMARY}>
              Send
            </button>
            <button type="button" onClick={() => answer(SKIPPED_ANSWER)} disabled={locked} className={SECONDARY}>
              Skip
            </button>
            <button type="button" onClick={finish} disabled={locked} className={SECONDARY}>
              Done
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              {onClosing ? 'Last question' : `Question ${asked} of up to ${FACT_CHAT_MAX_QUESTIONS}`}
            </span>
          </div>
        </div>
      )}

      {chat.done && (
        <p className="text-gray-600 dark:text-gray-400">
          {facts.length > 0 ? 'That is all CopyZap needs.' : 'Chat finished.'}{' '}
          <button type="button" onClick={restart} className={LINK}>
            Start the chat again
          </button>
        </p>
      )}

      <div className="flex flex-col gap-1.5 border-t border-gray-200 dark:border-gray-700 pt-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Facts CopyZap will use</h3>
        {facts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            None yet: CopyZap uses only what your copy says.
            {chat.draft.trim() && !chat.waiting && ' Your answer is not sent yet.'}
          </p>
        ) : (
          <>
            <ul className="m-0 p-0 list-none flex flex-col gap-1">
              {facts.map(fact => (
                <li key={fact} className="flex items-start justify-between gap-3 text-gray-900 dark:text-gray-100">
                  <span className="break-words">{fact}</span>
                  <button
                    type="button"
                    onClick={() => remove(fact)}
                    disabled={chat.waiting}
                    aria-label={`Take out: ${fact}`}
                    data-tip={TIPS.factRemove}
                    className={LINK + ' shrink-0'}
                  >
                    Take out
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-gray-600 dark:text-gray-400">
              The new versions use {facts.length === 1 ? 'it' : 'them'} as written here.
              {chat.draft.trim() && !chat.waiting && ' Your last answer is not sent yet.'}
            </p>
          </>
        )}
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start">
          <label htmlFor="quick-fact-add" className="sr-only">
            Add a fact in your own words
          </label>
          <GrowingField
            id="quick-fact-add"
            value={addDraft}
            maxLength={USER_FACT_MAX_CHARS}
            onChange={setAddDraft}
            onEnter={addFact}
            disabled={full}
            placeholder={full ? `Up to ${USER_FACTS_MAX} facts: take one out to add another` : 'Add a fact in your own words'}
            tip={TIPS.factAdd}
            className={FIELD + ' sm:flex-1'}
          />
          <button type="button" onClick={addFact} disabled={full || !addDraft.trim()} className={SECONDARY + ' sm:w-auto'}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickFactChat;

/** Whether this browser chose the chat last time. Kept for the next check screen; storage can fail, then it is off. */
const CHAT_CHOICE_KEY = 'copyzap.quick.factChat';

export function readChatChoice(): boolean {
  try {
    return window.localStorage.getItem(CHAT_CHOICE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveChatChoice(on: boolean): void {
  try {
    window.localStorage.setItem(CHAT_CHOICE_KEY, on ? 'on' : 'off');
  } catch {
    // Not kept: the chat is simply off next time.
  }
}
