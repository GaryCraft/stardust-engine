# Environment Variables

stardust-engine supports many environment variables to customize its behavior. The following is a list of all the environment variables that stardust-engine supports:

## General
- `SD_ENV`: The environment in which the application is running. Can be `development` or `production`. If not set, stardust-engine will default to `production`.

## Configuration
- `SD_CONFIG_PATH`: The path to the configuration directory. If not set, stardust-engine will use the default configuration directory. Which is `config` in the working directory.
  > It will be ignored if NODE_ENV is set to `development`.
- `SD_ALLOW_INSECURE_CONFIG`: If set to `true`, stardust-engine will allow insecure configurations. If not set, stardust-engine will not allow insecure configurations.
  > It will be ignored if NODE_ENV is set to `development`.

# Inherited Environment Variables

As stardust-engine is built on top of many libraries, it also inherits some environment variables from them. You can check the documentation of each library to see which environment variables are inherited.

- [Parzival](https://gitlab.com/spaceproject_/parzival)