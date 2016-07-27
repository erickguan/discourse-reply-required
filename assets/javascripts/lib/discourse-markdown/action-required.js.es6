import { registerOption } from 'pretty-text/pretty-text';

const CONTAINS_BLOCK_REGEX = /\n|<img|!\[[^\]]*\][(\[]/;

function insertReplyRequired(_, replyRequired) {
  const element = CONTAINS_BLOCK_REGEX.test(replyRequired) ? "div" : "span";
  return `<${element} class='action-required reply-required'>${replyRequired}</${element}>`;
}

function insertLoginRequired(_, loginRequired) {
  const element = CONTAINS_BLOCK_REGEX.test(loginRequired) ? "div" : "span";
  return `<${element} class='action-required login-required'>${loginRequired}</${element}>`;
}

function replaceActionRequired(text) {
  text = text || "";
  while (text !== (text = text.replace(/\[回复可见\]((?:(?!\[回复可见\]|\[\/回复可见\])[\S\s])*)\[\/回复可见\]/ig, insertReplyRequired)));
  while (text !== (text = text.replace(/\[登录可见\]((?:(?!\[登录可见\]|\[\/登录可见\])[\S\s])*)\[\/登录可见\]/ig, insertLoginRequired)));
  return text;
}

registerOption((siteSettings, opts) => {
  opts.features['action-required'] = !!siteSettings.discourse_reply_required_enabled;
});

export function setup(helper) {
  helper.whiteList([
    'div.action-required reply-required',
    'div.action-required login-required',
    'span.action-required reply-required',
    'span.action-required login-required'
  ]);

  helper.addPreProcessor(replaceActionRequired);
}
