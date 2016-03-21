reply-to-see-attachment
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
          - git clone https://github.com/fantasticfears/reply-to-see-attachment.git
```

* Rebuild the container

```
cd /var/docker
git pull
./launcher rebuild app
```

## License

Copyright 2016.
