discourse-reply-required
---------------------

Required replies to see attachment in the first post for Discourse.

## Installation

* Add the plugin's repo url to your container's `app.yml` file

```yml
hooks:
  after_code:
    - exec:
        cd: $home/plugins
        cmd:
          - mkdir -p plugins
          - git clone https://github.com/discourse/docker_manager.git
          - git clone https://github.com/fantasticfears/discourse-reply-required.git
```

* Rebuild the container

```
cd /var/docker
git pull
./launcher rebuild app
```

## License

GPLv2. Copyright 2016, Yujiang Yang.
