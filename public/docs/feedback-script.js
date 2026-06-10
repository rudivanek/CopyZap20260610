const SUPABASE_URL = 'https://gsismfzlmmtxmuzommya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXNtZnpsbW10eG11em9tbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzMTI1NTIsImV4cCI6MjA0Nzg4ODU1Mn0.DWo-iT_7zcapUEfehx37p9tnsDCyX0RUD3MjvzFYLC8';

function getSessionId() {
  let sessionId = localStorage.getItem('help_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('help_session_id', sessionId);
  }
  return sessionId;
}

function checkExistingVote(pageName) {
  const voteKey = `help_vote_${pageName}`;
  return localStorage.getItem(voteKey);
}

function saveVote(pageName, isHelpful) {
  const voteKey = `help_vote_${pageName}`;
  localStorage.setItem(voteKey, isHelpful ? 'yes' : 'no');
}

async function submitFeedback(pageName, isHelpful) {
  const existingVote = checkExistingVote(pageName);
  if (existingVote) {
    showMessage('You have already voted on this page', 'info');
    return;
  }

  const yesBtn = document.getElementById('feedback-yes');
  const noBtn = document.getElementById('feedback-no');
  yesBtn.disabled = true;
  noBtn.disabled = true;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-help-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        page_name: pageName,
        is_helpful: isHelpful,
        session_id: getSessionId(),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      saveVote(pageName, isHelpful);
      showMessage('Thank you for your feedback!', 'success');
    } else {
      if (data.already_voted) {
        saveVote(pageName, isHelpful);
        showMessage('You have already voted on this page', 'info');
      } else {
        showMessage('Failed to submit feedback. Please try again.', 'error');
        yesBtn.disabled = false;
        noBtn.disabled = false;
      }
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showMessage('Failed to submit feedback. Please try again.', 'error');
    yesBtn.disabled = false;
    noBtn.disabled = false;
  }
}

function showMessage(message, type) {
  const widget = document.getElementById('feedback-widget');
  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
  };
  widget.innerHTML = `<div class="${colors[type]} border rounded-lg p-4 text-center">${message}</div>`;
}

function initFeedback(pageName) {
  document.addEventListener('DOMContentLoaded', function() {
    const existingVote = checkExistingVote(pageName);
    if (existingVote) {
      showMessage('Thank you for your feedback!', 'success');
      return;
    }

    const yesBtn = document.getElementById('feedback-yes');
    const noBtn = document.getElementById('feedback-no');

    if (yesBtn && noBtn) {
      yesBtn.addEventListener('click', () => submitFeedback(pageName, true));
      noBtn.addEventListener('click', () => submitFeedback(pageName, false));
    }
  });
}
