import { decorateCooked } from 'discourse/lib/plugin-api';
import { withPluginApi } from 'discourse/lib/plugin-api';
import DiscourseURL from 'discourse/lib/url';
import DEditor from 'discourse/components/d-editor';

function initializeWithApi(api) {
  const currentUser = api.getCurrentUser();

  $.fn.actionRequired = function(options) {
    const noticeType = this.hasClass('attachment') ? '附件' : '内容',
      actionType = options === 'reply' ? '回复' : '登录',
      noticeText = `${actionType}后可查看${noticeType}`,
      topicController = api.container.lookup('controller:topic'),
      isRepliedState = topicController.get('model.details.is_replied');

    if (options === 'reply') { // reply action
      if (isRepliedState || currentUser && currentUser.get('staff')) {
        this.show(true);
      } else {
        this.show(false).replaceWith(`<div class="action-required action-required-notice reply-required-notice">${noticeText}</div>`);
      }

      if (currentUser) {
        $('body').off('click.ReplyRequired').on('click.ReplyRequired', '.reply-required-notice', function () {
          if (isRepliedState) {
            window.location.reload(false);
          } else {
            topicController.send('replyToPost');
          }
        });
      }
    } else { // login action
      if (currentUser) {
        this.show(true);
      } else {
        this.show(false).replaceWith(`<div class="action-required action-required-notice login-required-notice">${noticeText}</div>`);
      }
    }
  };

  /* Hiding topic widgets */
  api.decorateWidget('topic-map:before', helper => {
    const details = helper.getModel().get('topic.details');

    if (details && !details.get('is_replied') && details.get('reply_required') && helper.attrs.topicLinks) {
      const links = helper.attrs.topicLinks;
      var newLinks = [];

      for (var i = 0; i < links.length; i++) {
        if (!links[i].attachment)
          newLinks.push(links[i]);
      }
      helper.attrs.topicLinks = (newLinks.length === 0 ? null : newLinks);
    }
  });

  /* Toolbar items */
  api.onToolbarCreate(toolbar => {
    toolbar.addButton({
      id: 'login_action_required',
      group: 'extras',
      icon: 'sign-in',
      action: 'wrapLoginRequired'
    });
    toolbar.addButton({
      id: 'reply_action_required',
      group: 'extras',
      icon: 'lock',
      action: 'wrapReplyRequired'
    });
  });

  /* Reply Required Login section */
  $('body').off('click.ReplyRequired').on('click.ReplyRequired', '.action-required-notice', function() {
    if (!currentUser) {
      if (Discourse.Site.current().get("isReadOnly")) {
        bootbox.alert(I18n.t("read_only_mode.login_disabled"));
      } else {
        api.container.lookup('route:application').handleShowLogin();
      }
    }
  });

  /* Markdown baking */
  api.decorateCooked(($elem, model) => {
    // Always appears without model, apply only for first post in stream
    if (model && model.getModel().get('firstPost') || model) {
      $('.reply-required', $elem)
        .removeClass('reply-required')
        .addClass('reply-required')
        .actionRequired('reply');
      $('.login-required', $elem)
        .removeClass('login-required')
        .addClass('login-required')
        .actionRequired('login');
    }
  });

  /* Composer Controls */
  const ComposerController = api.container.lookupFactory('controller:composer');
  ComposerController.reopen({
    save(force) {
      const promise = this._super(force);

      const details = this.get('topic.details');
      if (details && !details.get('is_replied') && details.get('reply_required')) {
        const oldDisableJumpReply = currentUser.get('disable_jump_reply');

        // don't jump to post if need a reply
        currentUser.set('disable_jump_reply', true);
        const composer = this.get('model');

        if (promise) {
          return promise.then(() => {
            if (composer.get('replyingToTopic')) {
              DiscourseURL.routeTo(this.get('topic.firstPostUrl'));
              this.get('topic.postStream').refresh();
            }
          }).finally(() => currentUser.set('disable_jump_reply', oldDisableJumpReply));
        }
      }

      return promise;
    }
  });
}

export default {
  name: 'apply-reply-required',

  initialize(container) {
    const siteSettings = container.lookup('site-settings:main');

    if (siteSettings.discourse_reply_required_enabled) {
      withPluginApi('0.4', initializeWithApi);
    }

    DEditor.reopen({
      _wrapRequired(toolbarEvent, name_key) {
        const sel = this._getSelected(toolbarEvent.trimLeading);
        var text = `${sel.value}`;

        if (name_key === 'login') {
          text = `[登录可见]${text}[/登录可见]`;
        } else {
          text = `[回复可见]${text}[/回复可见]`;
        }
        this.set('value', `${sel.pre}${text}${sel.post}`);

        this._selectText(sel.start, text.length);
        Ember.run.scheduleOnce("afterRender", () => this.$("textarea.d-editor-input").focus());
      },

      actions: {
        wrapLoginRequired(toolbarEvent) { this._wrapRequired(toolbarEvent, 'login'); },
        wrapReplyRequired(toolbarEvent) { this._wrapRequired(toolbarEvent, 'reply'); }
      }
    });
  }
};
