import { registerOption } from 'pretty-text/pretty-text';

const CONTAINS_BLOCK_REGEX = /\n|<img|!\[[^\]]*\][(\[]/;

function insertReplyRequired(_, replyRequired) {
  var element = CONTAINS_BLOCK_REGEX.test(replyRequired) ? "div" : "span";
  return "<" + element + " class='reply-required'>" + replyRequired + "</" + element + ">";
}

function insertLoginRequired(_, loginRequired) {
  var element = CONTAINS_BLOCK_REGEX.test(loginRequired) ? "div" : "span";
  return "<" + element + " class='login-required'>" + loginRequired + "</" + element + ">";
}

function replaceRequiredReply(text) {
  text = text || "";
  while (text !== (text = text.replace(/\[回复可见\]((?:(?!\[回复可见\]|\[\/回复可见\])[\S\s])*)\[\/回复可见\]/ig, insertReplyRequired)));
  while (text !== (text = text.replace(/\[登录可见\]((?:(?!\[登录可见\]|\[\/登录可见\])[\S\s])*)\[\/登录可见\]/ig, insertLoginRequired)));
  return text;
}

registerOption((siteSettings, opts) => {
  opts.features.details = true;
});

export function setup(helper) {
  helper.whiteList([
    'div.reply-required',
    'div.login-required',
    'span.reply-required',
    'span.login-required'
  ]);

  helper.addPreProcessor(text => replaceRequiredReply(text));
}
