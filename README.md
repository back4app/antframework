# Ant Framework
Microservices made simple

## Getting Started
Clone this package from the [github repository](https://github.com/back4app/antframework) and install:
```sh
$ git clone https://github.com/back4app/antframework.git
$ cd antframework
$ npm install
```
or install it via NPM:
```sh
$ npm install @back4app/antframework -g
```

### Using the CLI tools
After installed, you can use the framework core functionalities by running `ant` if you've installed globally, or `bin/ant.js`. To find out all core commands available, type `ant --help`.

### Creating a new microservice
In order to create a new microservice, we can use the following command:
```sh
ant create <service> [(--template|-t) (<template_name>|<template_path>)]
```
It creates a new microservice based on the template provided, otherwise it will use the template located at the `lib/plugins/core/templates/services/default` directory by default. The default service template will include a GraphQL model and a plugin that allows you to start a GraphiQL server and test your service's endpoints.
```sh
$ ant create MyService # will create a MyService directory at the current working directory
$ cd MyService
$ ant start # will run the GraphiQL server
```

##### Customizing your GraphQL model
Within your microservice directory will be the file `model.graphql`, which is be responsable for defining the model of your GraphQL server (it includes a query for testing purposes). There you can befine own your GraphQL schemas to be parsed by the GraphQL API.

##### Customizing your GraphQL server
You can fully customize your GraphQL server by changing the graphQL plugin configuration in your microservice configuration file under the key `server`. By default, the server initialized by the Ant framework is located at `lib/plugins/graphQL/templates/default/bin/server.js`, at port `3000`. To change the default model file (`model.graphql`), you will need to change the `model` parameter.
```sh
- $GLOBAL/plugins/graphQL: # $GLOBAL is a variable that points to the Ant framework lib directory
  {} # The default (empty) configuration implies in using the following values below
  # The GraphQL plugin base path
  # basePath: ./
  # The GraphQL model path
  # model: ./model.graphql
  # The script to start the GraphQL API server when starting this service
  # server:
  #   bin: $GLOBAL/plugins/graphQL/templates/default/bin/server.js
  #   port: 3000
```

### Ant configuration files
There are two types of configuration file, the **Local** and the **Global**. The **Global** configuration file is located at `lib/globalConfig.yml`, and always will be used when your Ant instance is running. The **Local** configuration file is located at the current working directory, and will be created when any configuration file operation is done, such as adding new plugins or templates. The commands below can be used to make it easier to manipulate the configuration files:
- `ant plugin add <plugin> [-g|--global]`: Adds a plugin into a configuration file. Can use the option -g to install into the global configuration file.
- `ant plugin remove <plugin> [-g|--global]`: Removes a plugin from a configuration file. Can use the option -g to remove from the global configuration file.
- `ant template ls`: Lists all templates available to use, considering the configuration files being used (can list templates from both local and global configurations).
- `ant template add <category> <name> <path> [-g|--global]`: Adds a template into a configuration file. The template is composed by a `category` (a name used as a helper to classify our templates), a `name` (which is basically an identification for the template inside a `category`), and a `template path` which is the path to the template files. Can use the option -g to install into the global configuration file.
- `ant template remove <category> <name> [-g|--global]`: Removes a template from a configuration file. Can use the option -g to remove from the global configuration file.

Ant framework uses the YAML format on its configuration files. For more, check the links below:
[Official YAML page](http://yaml.org/)
[YAML Live Demo](http://nodeca.github.io/js-yaml/)

### License
The Ant framework is licensed under the [MIT](https://opensource.org/licenses/MIT) license.