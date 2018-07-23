/**
 * @fileoverview Tests for lib/templates/Template.js file.
 */

const path = require('path');
const fs = require('fs-extra');
const Template = require('../../../lib/templates/Template');

const template = new Template('FooCategory', 'FooTemplate', __dirname);

describe('lib/templates/Template.js', () => {
  test('should export "Template" class', () => {
    expect(template.constructor.name).toEqual('Template');
  });

  test('should fail if category, name and path are not a String', () => {
    expect(() => new Template()).toThrowError(
      'Could not initialize Template class: param "category" should be String'
    );
    expect(() => new Template('FooCategory')).toThrowError(
      'Could not initialize Template class: param "name" should be String'
    );
    expect(() => new Template(null, 'FooTemplate', 'FooPath')).toThrowError(
      'Could not initialize Template class: param "category" should be String'
    );

    expect(() => new Template('FooCategory', 'FooTemplate')).toThrowError(
      'Could not initialize Template class: param "path" should be String'
    );
  });

  describe('Template.category', () => {
    test('should be readonly', () => {
      expect(template.category).toEqual('FooCategory');
      template.category = 'AnotherFooCategory';
      expect(template.category).toEqual('FooCategory');
    });
  });

  describe('Template.name', () => {
    test('should be readonly', () => {
      expect(template.name).toEqual('FooTemplate');
      template.name = 'AnotherFooTemplate';
      expect(template.name).toEqual('FooTemplate');
    });
  });

  describe('Template.path', () => {
    test('should be readonly', () => {
      expect(template.path).toEqual(__dirname);
      template.path = 'FooPath';
      expect(template.path).toEqual(__dirname);
    });
  });

  describe('Template.render', () => {
    test('should render a template', async () => {
      const outPath = path.resolve(
        __dirname,
        '../../support/out/lib/templates/Template.js',
        'out' + Math.floor(Math.random() * 1000)
      );
      fs.ensureDirSync('../../support/out/lib/templates/Template.js');
      try {
        fs.removeSync(outPath);
      } finally {
        const template = new Template(
          'FooCategory',
          'FooTemplate',
          path.resolve(__dirname, '../../support/templates/fooTemplate')
        );
        await template.render(
          outPath,
          { fooData: 'fooValue' }
        );
        expect(fs.readdirSync(path.resolve(__dirname, '../../support')))
          .toContain('out');

        // Checks template directory files
        const outDir = fs.readdirSync(outPath);
        expect(outDir).toContain('mustacheFile.txt');
        expect(outDir).toContain('notAMustacheFile.txt');
        expect(outDir).toContain('templates.mustache.gz');
        expect(
          fs.readFileSync(path.resolve(outPath, 'mustacheFile.txt'), 'utf8')
        ).toEqual('fooValue\n');
        expect(
          fs.readFileSync(path.resolve(outPath, 'notAMustacheFile.txt'), 'utf8')
        ).toEqual('{{ fooData }}\n');
        expect(
          fs.readFileSync(path.resolve(outPath, 'templates.mustache.gz'), 'utf8')
        ).toEqual('Should NOT consider this as mustache template');

        // Checks template first level subdirectory file
        const outBarPath = path.resolve(outPath, 'bar');
        const outBarDir = fs.readdirSync(outBarPath);
        expect(outBarDir).toContain('bar.txt');
        expect(
          fs.readFileSync(path.resolve(outBarPath, 'bar.txt'), 'utf8')
        ).toEqual('{{bar}}');

        // Checks template second level subdirectory files
        const outCfgPath = path.resolve(outBarPath, 'cfg');
        const outCfgDir = fs.readdirSync(outCfgPath);
        expect(outCfgDir).toContain('hooks.cfg');
        expect(
          fs.readFileSync(path.resolve(outCfgPath, 'hooks.cfg'), 'utf8')
        ).toEqual('hooks.cfg content');
        expect(
          fs.readFileSync(path.resolve(outCfgPath, 'vars.cfg'), 'utf8')
        ).toEqual('vars.cfg content');

        fs.removeSync(outPath);
      }
    });

    test('should fail if outPath param is not a string', () => {
      expect(template.render()).rejects.toThrowError(
        'Could not render template: param "outPath" should be String'
      );
    });

    test('should fail if outPath already exists', () => {
      const outPath = path.resolve(
        __dirname,
        '../../support/out/lib/templates/Template.js',
        'out' + Math.floor(Math.random() * 1000)
      );
      fs.ensureDirSync(outPath);
      expect(template.render(outPath)).rejects.toThrowError(
        `Could not render template: path "${outPath}" already exists`
      );
      fs.removeSync(outPath);
    });
  });
});
