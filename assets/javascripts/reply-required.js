require('discourse/routes/topic').default.on("setupTopicController", function(event) {
  ReplyRequiredTopic = event.currentModel;
  TopicController = event.controller;
  TopicRoute = event;

  (function($) {
    var isReplied = function() {
      return ReplyRequiredTopic.get('details.is_replied');
    };

    // Applied to the reply-required class
    var applyReplyRequired = function($replyRequired, options) {
      var hidingElement, infoText,
        isRepliedState = isReplied();
      if ($replyRequired.hasClass('attachment')) {
        hidingElement = $replyRequired;
        infoText = '回复后可查看附件';
      } else {
        hidingElement = $replyRequired;
        infoText = '回复后可查看内容';
      }
      if (isRepliedState) {
        hidingElement.show(true);
      } else {
        hidingElement.show(false).replaceWith('<div class="reply-required-info">' + infoText + '</div>');
      }
      if (Discourse.User.current()) {
        $('body').off('click.ReplyRequired').on('click.ReplyRequired', '.reply-required-info', function() {
          if (isRepliedState) {
            window.location.reload(false);
          } else {
            TopicController.send('replyToPost');
          }
        });
      }
    };

    $.fn.replyRequired = function(options) {
      var opts = options || {},
        replies = this.each(function() {
          applyReplyRequired($(this), opts);
        });

      return replies;
    };

  })(jQuery);
});
