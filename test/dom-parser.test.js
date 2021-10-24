'use strict'

const { DOMParser } = require('../lib')
const { MIME_TYPE, NAMESPACE } = require('../lib/conventions')
const { __DOMHandler } = require('../lib/dom-parser')

const NS_CUSTOM = 'custom-default-ns'

describe('DOMParser', () => {
	describe('constructor', () => {
		test('should store passed options.locator', () => {
			const options = { locator: {} }
			const it = new DOMParser(options)

			it.parseFromString('<xml/>')

			const expected = {
				columnNumber: 1,
				lineNumber: 1,
			}
			expect(options.locator).toStrictEqual(expected)
		})

		test('should set the default namespace to null by default', () => {
			const options = { xmlns: {} }
			const it = new DOMParser(options)

			it.parseFromString('<xml/>')

			expect(options.xmlns['']).toBeNull()
		})

		test('should set the default namespace to null by default', () => {
			const options = { xmlns: {} }
			const it = new DOMParser(options)

			it.parseFromString('<xml/>')

			expect(options.xmlns['']).toBeNull()
		})

		test('should store passed options.xmlns for default mime type', () => {
			const xmlns = { '': NS_CUSTOM }
			const options = { xmlns }
			const it = new DOMParser(options)

			const actual = it.parseFromString('<xml/>')

			expect(actual.toString()).toBe('<xml xmlns="custom-default-ns"/>')
			expect(xmlns['']).toBe(NS_CUSTOM)
		})

		test('should store and modify passed options.xmlns for html mime type', () => {
			const xmlns = { '': NS_CUSTOM }
			const it = new DOMParser({ xmlns })

			it.parseFromString('<xml/>', 'text/html')

			expect(xmlns['']).toBe(NAMESPACE.HTML)
		})

		test('should store the default namespace for html mime type', () => {
			const xmlns = {}
			const it = new DOMParser({ xmlns })

			it.parseFromString('<xml/>', 'text/html')

			expect(xmlns['']).toBe(NAMESPACE.HTML)
		})

		test('should store  default namespace for XHTML mime type', () => {
			const xmlns = {}
			const it = new DOMParser({ xmlns })

			it.parseFromString('<xml/>', MIME_TYPE.XML_XHTML_APPLICATION)

			expect(xmlns['']).toBe(NAMESPACE.HTML)
		})

		test('should store and modify default namespace for XHTML mime type', () => {
			const xmlns = { '': NS_CUSTOM }
			const it = new DOMParser({ xmlns })

			it.parseFromString('<xml/>', MIME_TYPE.XML_XHTML_APPLICATION)

			expect(xmlns['']).toBe(NAMESPACE.HTML)
		})
	})

	describe('parseFromString', () => {
		test('should use minimal entity map for default mime type', () => {
			const XML = '<xml attr="&quot;">&lt; &amp;</xml>'

			const actual = new DOMParser().parseFromString(XML).toString()

			expect(actual).toBe(XML)
		})

		test("should create correct DOM for mimeType 'text/html'", () => {
			const doc = new DOMParser().parseFromString(
				'<HTML lang="en"></HTML>',
				MIME_TYPE.HTML
			)
			expect(doc.type).toBe('html')
			expect(doc.contentType).toBe(MIME_TYPE.HTML)
			expect(doc.documentElement.namespaceURI).toBe(NAMESPACE.HTML)
			expect(doc.documentElement.nodeName).toBe('HTML')
		})

		test("should create correct DOM for mimeType 'application/xhtml+xml'", () => {
			const doc = new DOMParser().parseFromString(
				'<HTML lang="en"></HTML>',
				MIME_TYPE.XML_XHTML_APPLICATION
			)
			expect(doc.type).toBe('xml')
			expect(doc.contentType).toBe(MIME_TYPE.XML_XHTML_APPLICATION)
			expect(doc.documentElement.namespaceURI).toBe(NAMESPACE.HTML)
			expect(doc.documentElement.nodeName).toBe('HTML')
		})

		test("should create correct DOM for mimeType 'image/svg+xml'", () => {
			const doc = new DOMParser().parseFromString(
				'<svg/>',
				MIME_TYPE.XML_SVG_IMAGE
			)
			expect(doc.type).toBe('xml')
			expect(doc.contentType).toBe(MIME_TYPE.XML_SVG_IMAGE)
			expect(doc.documentElement.namespaceURI).toBe(NAMESPACE.SVG)
			expect(doc.documentElement.nodeName).toBe('svg')
		})

		test('should provide access to textContent and attribute values', () => {
			// provides an executable example for https://github.com/xmldom/xmldom/issues/93
			const XML = `
			<pdf2xml producer="poppler" version="0.26.5">
				<page number="1" position="absolute" top="0" left="0" height="1262" width="892">
					<fontspec id="0" size="14" family="Times" color="#000000"/>
					<text top="0" >first</text>
					<text top="1" >second</text>
					<text top="2" >last</text>
				</page>
			</pdf2xml>
`
			/*
			 TODO: again this is the "simples and most readable way,
			  but it also means testing it over and over
			*/
			const document = new DOMParser().parseFromString(XML)
			/*
			 FIXME: from here we are actually testing the Document/Element/Node API
			 maybe this should be split?
			*/
			const textTags = document.getElementsByTagName('text')

			expect(textTags).toHaveLength(3)

			const expectedText = ['first', 'second', 'last']
			for (let i = 0; i < textTags.length; i++) {
				const textTag = textTags[i]
				expect(textTag.textContent).toBe(expectedText[i])
				expect(textTag.getAttribute('top')).toBe(`${i}`)
			}
		})
	})
})

describe('DOMHandler', () => {
	describe('startDocument', () => {
		test('should create an XML document when mimeType option is not passed', () => {
			const handler = new __DOMHandler()
			expect(handler.mimeType).toBe(MIME_TYPE.XML_APPLICATION)
			handler.startDocument()
			expect(handler.doc.childNodes).toHaveLength(0)
			expect(handler.doc.type).toBe('xml')
		})

		test.each([
			undefined,
			MIME_TYPE.XML_APPLICATION,
			MIME_TYPE.XML_XHTML_APPLICATION,
			MIME_TYPE.XML_TEXT,
			MIME_TYPE.XML_SVG_IMAGE,
		])(
			'should create an XML document when mimeType option is %s',
			(mimeType) => {
				const handler = new __DOMHandler({ mimeType })
				expect(handler.mimeType).toBe(mimeType || MIME_TYPE.XML_APPLICATION)
				handler.startDocument()
				expect(handler.doc.childNodes).toHaveLength(0)
				expect(handler.doc.type).toBe('xml')
			}
		)
		test("should create an HTML document when mimeType option is 'text/html'", () => {
			const handler = new __DOMHandler({ mimeType: MIME_TYPE.HTML })
			expect(handler.mimeType).toBe(MIME_TYPE.HTML)
			handler.startDocument()
			expect(handler.doc.childNodes).toHaveLength(0)
			expect(handler.doc.type).toBe('html')
		})
	})
})
