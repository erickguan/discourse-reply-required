import { decorateCooked } from 'discourse/lib/plugin-api';
import ApplicationRoute from 'discourse/routes/application';
import { withPluginApi } from 'discourse/lib/plugin-api';
import TopicDetails from 'discourse/models/topic-details';
import Composer from 'discourse/controllers/composer';
import DiscourseURL from 'discourse/lib/url';

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
        id: 'reply-to-see-attchment-hide',
        group: 'extras',
        icon: 'lock',
        perform: e => e.applySurround('[回复可见]', '[/回复可见]', 'reply_to_see')
      });
    });

    $('body').off('click.ReplyRequired').on('click.ReplyRequired', '.reply-required-info', function() {
      if (!api.getCurrentUser()) {
        if (Discourse.Site.current().get("isReadOnly")) {
          bootbox.alert(I18n.t("read_only_mode.login_disabled"));
        } else {
          container.lookup('route:application').handleShowLogin()
        }
      }
    });
    api.decorateCooked(($elem, model) => {
      // Always appears without model, apply only for first post in stream
      if (model && model.getModel().get('firstPost') || model)
        $('.reply-required', $elem)
          .removeClass('reply-required')
          .addClass('reply-required')
          .replyRequired(); // TODO: can find a way around to hook
    });
  }
}

export default {
  name: "apply-reply-required",

  initialize(container) {
    const siteSettings = container.lookup('site-settings:main');

    if (siteSettings.reply_to_see_attachment_enabled) {
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
                  this.get('topic.postStream').refresh()
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
