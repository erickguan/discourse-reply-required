(function() {

  var CONTAINS_BLOCK_REGEX = /\n|<img|!\[[^\]]*\][(\[]/;

  function insertReplyRequired(_, replyRequired) {
    var element = CONTAINS_BLOCK_REGEX.test(replyRequired) ? "div" : "span";
    return "<" + element + " class='reply-required'>" + replyRequired + "</" + element + ">";
  }

  function replaceRequiredReply(text) {
    text = text || "";
    while (text !== (text = text.replace(/\[回复可见\]((?:(?!\[回复可见\]|\[\/回复可见\])[\S\s])*)\[\/回复可见\]/ig, insertReplyRequired)));
    return text;
  }

  Discourse.Dialect.addPreProcessor(function(text) {
    if (Discourse.SiteSettings.reply_to_see_attachment_enabled) {
      text = replaceRequiredReply(text);
    }
    return text;
  });

  Discourse.Markdown.whiteListTag('span', 'class', 'reply-required');
  Discourse.Markdown.whiteListTag('div', 'class', 'reply-required');
})();
