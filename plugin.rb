# name: Discourse Reply Required
# about: Required reply before sees the attachment
# version: 0.11
# authors: Erick Guan (fantasticfears@gmail.com)

enabled_site_setting :discourse_reply_required_enabled

register_asset "stylesheets/discourse-reply-required.css"

REPLY_REQUIRED_REGEXP = /\[回复可见\]((?:(?!\[回复可见\]|\[\/回复可见\])[\S\s])*)\[\/回复可见\]/i
REPLY_REQUIRED_TOPIC_CUSTOM_FILED_NAME = 'reply-required'

def set_topic_custom_field_reply_required(topic_id, flag)
  tf = TopicCustomField.find_or_initialize_by(topic_id: topic_id, name: 'reply-required')
  tf.value = flag
  tf.save!
end

module ::TopicViewExtension
  def is_replied
    if @user
      Post.where(topic_id: @topic.id, user_id: @user.id)
        .limit(1)
        .count
    else
      false
    end
  end
end

module ::TopicViewSerializerExtension
  def details
    result = super
    result[:reply_required] = false

    cf = TopicCustomField.find_by(topic_id: object.topic.id,
                                  name: REPLY_REQUIRED_TOPIC_CUSTOM_FILED_NAME)

    if cf && (cf.value == "t" || cf.value == "true") # true
      result[:reply_required] = true
      result[:is_replied] = object.is_replied
    end

    result
  end
end

after_initialize do
  # When create
  DiscourseEvent.on(:topic_created) do |topic, opts, user|
    # Existing block
    if REPLY_REQUIRED_REGEXP.match opts[:raw]
      set_topic_custom_field_reply_required(topic.id, true)
    else
      set_topic_custom_field_reply_required(topic.id, false)
    end
  end

  # When first post edits
  DiscourseEvent.on(:validate_post) do |post|
    # Existing block
    if post.is_first_post?
      if REPLY_REQUIRED_REGEXP.match(post.raw)
        set_topic_custom_field_reply_required(post.topic.id, true)
      else
        set_topic_custom_field_reply_required(post.topic.id, false)
      end
    end
  end

  TopicView.class_eval do
    prepend ::TopicViewExtension
  end

  TopicViewSerializer.class_eval do
    prepend ::TopicViewSerializerExtension
  end
end
