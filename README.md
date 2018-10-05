# Ant Framework
Ant is an open-source and unopinionated framework to make microservices development easy.

## Quickstart
### 1. Install the Ant CLI via npm

```Shell
npm install -g @back4app/ant-cli
```

### 2. Create a new microservice

```Shell
ant create MyService
```

Ant Framework will use the default template to create a brand new GraphQL service. Use --template option to select from many different templates and create other kind of services such as RESTful or SOAP APIs. [Learn more](#using-different-templates)

### 3. Start the microservice in your localhost

```Shell
cd MyService
ant start
```

### 4. Play with your brand new GraphQL API
![GraphiQL](https://ant.back4app.com/ant-sequence-01.gif)

Learn more about GraphQL at [GraphQL official web-site](https://graphql.org/).

The default template brings to you an example query called `hello`. By customizing the GraphQL model and creating Ant Functions, you can develop your own GraphQL queries, mutations and subscriptions. [Learn more](#your-first-ant-function)

### 5. Create your first Ant Function
Edit the `model.graphql` file and use the following code:

```GraphQL
schema {
  query: Query
}

type Query {
  hello(name: String = "World"): String @resolve(to: "queryHello")
}
```

Create a file called `queryHello.js` and use the following code:

```JavaScript
module.exports = ({ name }) => `Hello ${name} from function!!!`;
```

Run the following command:

```Shell
ant function add queryHello ./queryHello.js Node
```

It's done! Run and play with your brand new GraphQL API!

You can create any kind of query, mutation or subscription. You can use different runtimes to write code using your preferred programming language such as Node.js, Python, Java or C#. Learn more about [customizing your GraphQL model](#customizing-your-graphql-model) and [creating Ant Functions](#creating-ant-functions).

### 6. Deploy to AWS Lambda via Serverless

```Shell
aws configure
ant deploy
```

Learn more about how to setup the AWS CLI at [AWS official guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html).

Ant Framework will use the default template to deploy the new service to your own AWS account Lambda via Serverless framework. Other templates can be used for choosing from many different providers and deploying to a wide range of scenarios of public and private clouds. [Learn more](#deploying-your-microservice)

## Concepts
### Using the CLI tools
After installed, you can use the framework core functionalities by running the `ant` command. To find out all core commands available, type `ant --help`.

### Creating a new microservice
In order to create a new microservice, we can use the following command:

```Shell
ant create <service> [(--template|-t) (<template_name>|<template_path>)]
```

It creates a new microservice based on the template provided, otherwise it will use the template located at the `lib/plugins/core/templates/services/default` directory by default. The default service template will include a GraphQL model and a plugin that allows you to start a GraphiQL server and test your service's endpoints.

```Shell
ant create MyService # will create a MyService directory at the current working directory
cd MyService
ant start # will run the GraphiQL server
```

##### Customizing your GraphQL model
Within your microservice directory will be the file `model.graphql`, which is be responsable for defining the model of your GraphQL server (it includes a query for testing purposes). There you can befine own your GraphQL schemas to be parsed by the GraphQL API.

###### Using directives
WIP

1. @mock
WIP

2. @resolve
WIP

3. @sql
WIP

4. @mongo
WIP

5. @graphql
WIP

6. @parse
WIP

7. others
WIP

##### Creating Ant Functions
WIP

###### Using different runtimes
WIP

1. Node
WIP

2. Python
WIP

3. Java
WIP

4. C#
WIP

5. Others
WIP

##### Customizing your GraphQL server
You can fully customize your GraphQL server by changing the graphQL plugin configuration in your microservice configuration file under the key `server`. By default, the server initialized by the Ant framework is located at `lib/plugins/graphQL/templates/default/bin/server.js`, at port `3000`. To change the default model file (`model.graphql`), you will need to change the `model` parameter.

```YAML
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

##### Using different templates
WIP

###### GraphQL APIs
WIP

###### RESTful APIs
WIP

###### SOAP APIs
WIP

### Deploying your microservice
WIP

#### Working with Serverless framework
WIP

##### Deploying to AWS
WIP

##### Deploying to Azure
WIP

##### Deploying to Google Cloud
WIP

#### Working with Back4App
WIP

#### Working with Kubernetes
WIP

#### Creating your own deployment process
WIP

### Plugins
WIP

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

## Extending the Ant Framework
WIP

### Creating your own templates
WIP

### Creating your own directives
It is possible to define your own directives by configuring them on the Ant's configuration file, under the GraphQL plugin configuration entry.
This configuration should respect the following format:
respect the following format, under the "directives" key:

```YAML
{
  <name>: {
    resolver: {
      handler: <handler>,
      runtime: <runtime>
    },
    definition: <definition>
  }
}
```

Where:
`<name>` is the Directive name;
`<handler>` is the path to the function to resolve the Directive;
`<runtime>` the runtime name to run the handler;
`<definition>` the GraphQL definition of the directive, to be injected into the GraphQL schema.

If you wish to add your "foo" and "bar" directives, It could use the example below:

```YAML
plugins:
  - $GLOBAL/plugins/graphQL: # Under the plugin entry goes our directives configuration
      directives:
        foo:
          resolver:
            handler: /my/foo.js # This file is going to be our directive resolver.
            runtime: Node # This is name of the runtime to run our handler (it should be already configured on Ant)
          definition: "directive @foo(myParam: String, myOtherParam: Int) on FIELD_DEFINITION" # This is what we inject into the GraphQL schema. Nothing more, nothing less.
        bar:
          resolver:
            handler: /path/to/bar.py
            runtime: Python
          definition: "directive @bar on FIELD_DEFINITION" # In this case, we chose not to provide any parameters to the directive, and It is totally fine.
```

### Creating new runtimes
WIP

### Customizing providers
WIP

### Packaging new plugins
WIP

#### Customizing the CLI
WIP

## API Reference
[API Reference](https://ant.back4app.com/docs/api/index.html)

## Contributing
WIP

## License
The Ant framework is licensed under the [MIT](https://opensource.org/licenses/MIT) license.
