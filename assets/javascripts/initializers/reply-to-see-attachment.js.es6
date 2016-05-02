import { decorateCooked } from 'discourse/lib/plugin-api';
import { withPluginApi } from 'discourse/lib/plugin-api';
import Composer from 'discourse/controllers/composer';
import DiscourseURL from 'discourse/lib/url';
import DEditor from 'discourse/components/d-editor';

function initializeWithApi(api) {
  const siteSettings = api.container.lookup('site-settings:main');

  if (siteSettings.reply_to_see_attachment_enabled) {

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

    api.onToolbarCreate(toolbar => {
      toolbar.addButton({
        id: 'reply-to-see-attchment-login',
        group: 'extras',
        icon: 'sign-in',
        action: 'wrapLoginRequired'
      });
      toolbar.addButton({
        id: 'reply-to-see-attchment-hide',
        group: 'extras',
        icon: 'lock',
        action: 'wrapReplyRequired'
      });
    });

    $('body').off('click.ReplyRequired').on('click.ReplyRequired', '.reply-required-info, .login-required-info', function() {
      if (!api.getCurrentUser()) {
        if (Discourse.Site.current().get("isReadOnly")) {
          bootbox.alert(I18n.t("read_only_mode.login_disabled"));
        } else {
          api.container.lookup('route:application').handleShowLogin();
        }
      }
    });

    api.decorateCooked(($elem, model) => {
      // Always appears without model, apply only for first post in stream
      if (model && model.getModel().get('firstPost') || model) {
        $('.reply-required', $elem)
          .removeClass('reply-required')
          .addClass('reply-required')
          .replyRequired(); // TODO: can find a way around to hook
        $('.login-required', $elem)
          .removeClass('login-required')
          .addClass('login-required')
          .loginRequired();
      }
    });
  }
}

export default {
  name: "apply-reply-required",

  initialize(container) {
    const siteSettings = container.lookup('site-settings:main');

    if (siteSettings.reply_to_see_attachment_enabled) {
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

      Composer.reopen({
        save(force) {
          const promise = this._super(force);

          const details = this.get('topic.details');

          if (details && !details.get('is_replied') && details.get('reply_required')) {
            const oldDisableJumpReply = Discourse.User.currentProp('disable_jump_reply');

            // don't jump to post if need a reply
            Discourse.User.currentProp('disable_jump_reply', true);
            const composer = this.get('model');

            if (promise) {
              return promise.then(() => {
                if (composer.get('replyingToTopic')) {
                  DiscourseURL.routeTo(this.get('topic.firstPostUrl'));
                  this.get('topic.postStream').refresh();
                }
              }).finally(() => Discourse.User.currentProp('disable_jump_reply', oldDisableJumpReply));
            }
          }

          return promise;
        }
      });
    }

    withPluginApi('0.1', initializeWithApi);
  }
};
