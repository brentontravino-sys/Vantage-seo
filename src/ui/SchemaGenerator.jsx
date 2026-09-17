import React, { useState } from 'react';
import {
  generateFAQSchema,
  generateHowToSchema,
  generateArticleSchema,
  generateProductSchema,
  generateLocalBusinessSchema,
  generateBreadcrumbSchema,
  generateVideoSchema,
  formatJsonLD,
  validateSchema,
} from '@/lib/schema-generator';
import { Button } from '@/ui/button';
import { Textarea } from '@/ui/textarea';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { Copy, Download, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQ_EXAMPLES = [
  { question: 'What is SEO and why does it matter?', answer: 'SEO (Search Engine Optimization) is the practice of improving your website to increase its visibility in search engines like Google. It matters because higher visibility drives more organic traffic.' },
  { question: 'How long does SEO take to show results?', answer: 'SEO typically takes 3-6 months to show meaningful results, though this varies based on competition, industry, and the current state of your website.' },
];

const BUSINESS_TYPES = [
  'LocalBusiness',
  'Restaurant',
  'Dentist',
  'MedicalClinic',
  'Lawyer',
  'HomeAndConstructionBusiness',
  'Store',
  'AutoRepair',
  'RealEstateAgent',
  'HealthAndBeautyBusiness',
];

const ARTICLE_TYPES = ['Article', 'NewsArticle', 'BlogPosting'];

const PRODUCT_AVAILABILITY = ['InStock', 'OutOfStock', 'PreOrder', 'BackOrder'];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD'];

export default function SchemaGenerator() {
  const [schemaType, setSchemaType] = useState('FAQPage');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // FAQ state
  const [faqs, setFaqs] = useState(FAQ_EXAMPLES);
  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);
  const updateFaq = (i, field, val) => {
    const next = [...faqs];
    next[i][field] = val;
    setFaqs(next);
  };
  const removeFaq = (i) => setFaqs(faqs.filter((_, idx) => idx !== i));

  // HowTo state
  const [howtoName, setHowtoName] = useState('');
  const [howtoDescription, setHowtoDescription] = useState('');
  const [howtoTotalTime, setHowtoTotalTime] = useState('');
  const [howtoCurrency, setHowtoCurrency] = useState('USD');
  const [howtoEstimatedCost, setHowtoEstimatedCost] = useState('');
  const [howtoSteps, setHowtoSteps] = useState([
    { name: 'Step 1', text: '', image: '' },
    { name: 'Step 2', text: '', image: '' },
  ]);
  const addStep = () => setHowtoSteps([...howtoSteps, { name: '', text: '', image: '' }]);
  const updateStep = (i, field, val) => {
    const next = [...howtoSteps];
    next[i][field] = val;
    setHowtoSteps(next);
  };

  // Article state
  const [articleHeadline, setArticleHeadline] = useState('');
  const [articleDescription, setArticleDescription] = useState('');
  const [articleType, setArticleType] = useState('Article');
  const [articleAuthorName, setArticleAuthorName] = useState('');
  const [articleAuthorType, setArticleAuthorType] = useState('Person');
  const [articleAuthorUrl, setArticleAuthorUrl] = useState('');
  const [articlePublisherName, setArticlePublisherName] = useState('');
  const [articlePublisherLogo, setArticlePublisherLogo] = useState('');
  const [articleDatePublished, setArticleDatePublished] = useState('');
  const [articleDateModified, setArticleDateModified] = useState('');
  const [articleImage, setArticleImage] = useState('');

  // Product state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productMpn, setProductMpn] = useState('');
  const [productGtin, setProductGtin] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCurrency, setProductCurrency] = useState('USD');
  const [productAvailability, setProductAvailability] = useState('InStock');
  const [productUrl, setProductUrl] = useState('');
  const [productPriceValidUntil, setProductPriceValidUntil] = useState('');
  const [productRatingValue, setProductRatingValue] = useState('');
  const [productReviewCount, setProductReviewCount] = useState('');

  // LocalBusiness state
  const [lbBusinessType, setLbBusinessType] = useState('LocalBusiness');
  const [lbName, setLbName] = useState('');
  const [lbDescription, setLbDescription] = useState('');
  const [lbPhone, setLbPhone] = useState('');
  const [lbUrl, setLbUrl] = useState('');
  const [lbImage, setLbImage] = useState('');
  const [lbPriceRange, setLbPriceRange] = useState('');
  const [lbStreet, setLbStreet] = useState('');
  const [lbCity, setLbCity] = useState('');
  const [lbState, setLbState] = useState('');
  const [lbPostal, setLbPostal] = useState('');
  const [lbCountry, setLbCountry] = useState('US');
  const [lbLat, setLbLat] = useState('');
  const [lbLng, setLbLng] = useState('');

  // Breadcrumb state
  const [breadcrumbs, setBreadcrumbs] = useState([
    { name: 'Home', url: '/' },
    { name: 'Category', url: '/category' },
  ]);
  const addCrumb = () => setBreadcrumbs([...breadcrumbs, { name: '', url: '' }]);
  const updateCrumb = (i, field, val) => {
    const next = [...breadcrumbs];
    next[i][field] = val;
    setBreadcrumbs(next);
  };
  const removeCrumb = (i) => setBreadcrumbs(breadcrumbs.filter((_, idx) => idx !== i));

  // Video state
  const [videoName, setVideoName] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState('');
  const [videoUploadDate, setVideoUploadDate] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [videoContentUrl, setVideoContentUrl] = useState('');
  const [videoEmbedUrl, setVideoEmbedUrl] = useState('');

  const generate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 100);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = (schema, filename) => {
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderFAQ = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-300">FAQ Items</h4>
        <Button size="sm" variant="outline" onClick={addFaq} className="gap-1">
          + Add
        </Button>
      </div>
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">#{i + 1}</span>
            {faqs.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => removeFaq(i)} className="text-neutral-500 hover:text-red-400">
                Remove
              </Button>
            )}
          </div>
          <Input
            placeholder="Question"
            value={faq.question}
            onChange={(e) => updateFaq(i, 'question', e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
          />
          <Textarea
            placeholder="Answer"
            value={faq.answer}
            onChange={(e) => updateFaq(i, 'answer', e.target.value)}
            rows={3}
            className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
          />
        </div>
      ))}
    </div>
  );

  const renderHowTo = () => (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Title (e.g. How to Change a Tire)"
          value={howtoName}
          onChange={(e) => setHowtoName(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="Total Time (ISO 8601, e.g. PT30M)"
          value={howtoTotalTime}
          onChange={(e) => setHowtoTotalTime(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
      <Textarea
        placeholder="Description"
        value={howtoDescription}
        onChange={(e) => setHowtoDescription(e.target.value)}
        rows={3}
        className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Estimated Cost"
          value={howtoEstimatedCost}
          onChange={(e) => setHowtoEstimatedCost(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Select value={howtoCurrency} onValueChange={setHowtoCurrency}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-300">Steps</h4>
        <Button size="sm" variant="outline" onClick={addStep} className="gap-1">
          + Add Step
        </Button>
      </div>
      {howtoSteps.map((step, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Step {i + 1}</span>
            {howtoSteps.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => setHowtoSteps(howtoSteps.filter((_, idx) => idx !== i))} className="text-neutral-500 hover:text-red-400">
                Remove
              </Button>
            )}
          </div>
          <Input
            placeholder="Step name (optional)"
            value={step.name}
            onChange={(e) => updateStep(i, 'name', e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
          />
          <Textarea
            placeholder="Instructions"
            value={step.text}
            onChange={(e) => updateStep(i, 'text', e.target.value)}
            rows={2}
            className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
          />
          <Input
            placeholder="Image URL (optional)"
            value={step.image}
            onChange={(e) => updateStep(i, 'image', e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
          />
        </div>
      ))}
    </div>
  );

  const renderArticle = () => (
    <div className="grid gap-4">
      <Select value={articleType} onValueChange={(v) => setArticleType(v)}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ARTICLE_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Headline *"
          value={articleHeadline}
          onChange={(e) => setArticleHeadline(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="Author Name *"
          value={articleAuthorName}
          onChange={(e) => setArticleAuthorName(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
      <Select value={articleAuthorType} onValueChange={setArticleAuthorType}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Person">Person</SelectItem>
          <SelectItem value="Organization">Organization</SelectItem>
        </SelectContent>
      </Select>
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Author URL"
          value={articleAuthorUrl}
          onChange={(e) => setArticleAuthorUrl(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="Publisher Name *"
          value={articlePublisherName}
          onChange={(e) => setArticlePublisherName(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
      <Input
        placeholder="Publisher Logo URL"
        value={articlePublisherLogo}
        onChange={(e) => setArticlePublisherLogo(e.target.value)}
        className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          value={articleDatePublished}
          onChange={(e) => setArticleDatePublished(e.target.value)}
          className="bg-white/5 border-white/10 text-white"
        />
        <Input
          type="date"
          value={articleDateModified}
          onChange={(e) => setArticleDateModified(e.target.value)}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <Textarea
        placeholder="Description *"
        value={articleDescription}
        onChange={(e) => setArticleDescription(e.target.value)}
        rows={3}
        className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
      />
      <Input
        placeholder="Image URL"
        value={articleImage}
        onChange={(e) => setArticleImage(e.target.value)}
        className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
      />
    </div>
  );

  const renderProduct = () => (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Product Name *"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="Brand"
          value={productBrand}
          onChange={(e) => setProductBrand(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input
          placeholder="SKU"
          value={productSku}
          onChange={(e) => setProductSku(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="MPN"
          value={productMpn}
          onChange={(e) => setProductMpn(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="GTIN/UPC/EAN"
          value={productGtin}
          onChange={(e) => setProductGtin(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
      <Textarea
        placeholder="Description *"
        value={productDescription}
        onChange={(e) => setProductDescription(e.target.value)}
        rows={3}
        className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
      />
      <Input
        placeholder="Product Image URL"
        value={productImage}
        onChange={(e) => setProductImage(e.target.value)}
        className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
      />
      <div className="grid grid-cols-3 gap-4">
        <Input
          placeholder="Price *"
          value={productPrice}
          onChange={(e) => setProductPrice(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Select value={productCurrency} onValueChange={setProductCurrency}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={productAvailability} onValueChange={setProductAvailability}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_AVAILABILITY.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Product URL"
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          type="date"
          placeholder="Price Valid Until"
          value={productPriceValidUntil}
          onChange={(e) => setProductPriceValidUntil(e.target.value)}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Average Rating (e.g. 4.5)"
          value={productRatingValue}
          onChange={(e) => setProductRatingValue(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="Number of Reviews"
          value={productReviewCount}
          onChange={(e) => setProductReviewCount(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
    </div>
  );

  const renderLocalBusiness = () => (
    <div className="grid gap-4">
      <Select value={lbBusinessType} onValueChange={setLbBusinessType}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BUSINESS_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Business Name *"
          value={lbName}
          onChange={(e) => setLbName(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="Phone"
          value={lbPhone}
          onChange={(e) => setLbPhone(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Website URL"
          value={lbUrl}
          onChange={(e) => setLbUrl(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Select
          value={lbPriceRange}
          onValueChange={setLbPriceRange}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            <SelectItem value="$">$</SelectItem>
            <SelectItem value="$$">$$</SelectItem>
            <SelectItem value="$$$">$$$</SelectItem>
            <SelectItem value="$$$$">$$$$</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea
        placeholder="Description"
        value={lbDescription}
        onChange={(e) => setLbDescription(e.target.value)}
        rows={2}
        className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
      />
      <Input
        placeholder="Image URL"
        value={lbImage}
        onChange={(e) => setLbImage(e.target.value)}
        className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Street Address *"
          value={lbStreet}
          onChange={(e) => setLbStreet(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="City *"
          value={lbCity}
          onChange={(e) => setLbCity(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input
          placeholder="State/Region *"
          value={lbState}
          onChange={(e) => setLbState(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="Postal Code *"
          value={lbPostal}
          onChange={(e) => setLbPostal(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Select value={lbCountry} onValueChange={setLbCountry}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US">US</SelectItem>
            <SelectItem value="CA">CA</SelectItem>
            <SelectItem value="GB">GB</SelectItem>
            <SelectItem value="AU">AU</SelectItem>
            <SelectItem value="ZA">ZA</SelectItem>
            <SelectItem value="DE">DE</SelectItem>
            <SelectItem value="FR">FR</SelectItem>
            <SelectItem value="BR">BR</SelectItem>
            <SelectItem value="IN">IN</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Latitude"
          value={lbLat}
          onChange={(e) => setLbLat(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="Longitude"
          value={lbLng}
          onChange={(e) => setLbLng(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
    </div>
  );

  const renderBreadcrumb = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-300">Breadcrumb Items</h4>
        <Button size="sm" variant="outline" onClick={addCrumb} className="gap-1">
          + Add
        </Button>
      </div>
      {breadcrumbs.map((crumb, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">#{i + 1}</span>
            {breadcrumbs.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => removeCrumb(i)} className="text-neutral-500 hover:text-red-400">
                Remove
              </Button>
            )}
          </div>
          <Input
            placeholder="Label"
            value={crumb.name}
            onChange={(e) => updateCrumb(i, 'name', e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
          />
          <Input
            placeholder="URL (optional)"
            value={crumb.url}
            onChange={(e) => updateCrumb(i, 'url', e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
          />
        </div>
      ))}
    </div>
  );

  const renderVideo = () => (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Video Name *"
          value={videoName}
          onChange={(e) => setVideoName(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          type="date"
          placeholder="Upload Date"
          value={videoUploadDate}
          onChange={(e) => setVideoUploadDate(e.target.value)}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <Textarea
        placeholder="Description *"
        value={videoDescription}
        onChange={(e) => setVideoDescription(e.target.value)}
        rows={3}
        className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Thumbnail URL *"
          value={videoThumbnailUrl}
          onChange={(e) => setVideoThumbnailUrl(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="Duration (ISO 8601, e.g. PT5M30S)"
          value={videoDuration}
          onChange={(e) => setVideoDuration(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Content URL"
          value={videoContentUrl}
          onChange={(e) => setVideoContentUrl(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
        <Input
          placeholder="Embed URL"
          value={videoEmbedUrl}
          onChange={(e) => setVideoEmbedUrl(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
        />
      </div>
    </div>
  );

  const getSchema = () => {
    switch (schemaType) {
      case 'FAQPage':
        return generateFAQSchema(faqs);
      case 'HowTo':
        return generateHowToSchema({
          name: howtoName,
          description: howtoDescription,
          totalTime: howtoTotalTime,
          currency: howtoCurrency,
          estimatedCost: howtoEstimatedCost ? parseFloat(howtoEstimatedCost) : null,
          steps: howtoSteps,
          image: '',
        });
      case 'Article':
      case 'NewsArticle':
      case 'BlogPosting':
        return generateArticleSchema({
          articleType: articleType,
          headline: articleHeadline,
          description: articleDescription,
          authorName: articleAuthorName,
          authorType: articleAuthorType,
          authorUrl: articleAuthorUrl,
          publisherName: articlePublisherName,
          publisherLogo: articlePublisherLogo,
          datePublished: articleDatePublished,
          dateModified: articleDateModified || undefined,
          image: articleImage || undefined,
        });
      case 'Product':
        return generateProductSchema({
          name: productName,
          description: productDescription,
          brand: productBrand || undefined,
          sku: productSku || undefined,
          mpn: productMpn || undefined,
          gtin: productGtin || undefined,
          image: productImage || undefined,
          price: productPrice ? parseFloat(productPrice) : null,
          currency: productCurrency,
          availability: productAvailability,
          url: productUrl || undefined,
          priceValidUntil: productPriceValidUntil || undefined,
          ratingValue: productRatingValue ? parseFloat(productRatingValue) : null,
          reviewCount: productReviewCount ? parseInt(productReviewCount, 10) : null,
        });
      case 'LocalBusiness':
        return generateLocalBusinessSchema({
          businessType: lbBusinessType,
          name: lbName,
          description: lbDescription || undefined,
          telephone: lbPhone || undefined,
          url: lbUrl || undefined,
          image: lbImage || undefined,
          priceRange: lbPriceRange || undefined,
          streetAddress: lbStreet,
          addressLocality: lbCity,
          addressRegion: lbState,
          postalCode: lbPostal,
          addressCountry: lbCountry,
          latitude: lbLat ? parseFloat(lbLat) : null,
          longitude: lbLng ? parseFloat(lbLng) : null,
          openingHours: [],
        });
      case 'BreadcrumbList':
        return generateBreadcrumbSchema(breadcrumbs);
      case 'VideoObject':
        return generateVideoSchema({
          name: videoName,
          description: videoDescription,
          thumbnailUrl: videoThumbnailUrl,
          uploadDate: videoUploadDate,
          duration: videoDuration || undefined,
          contentUrl: videoContentUrl || undefined,
          embedUrl: videoEmbedUrl || undefined,
        });
      default:
        return null;
    }
  };

  const schema = getSchema();
  const isValid = schema ? validateSchema(schema).valid : false;
  const jsonLD = schema ? formatJsonLD(schema) : '';

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Schema Markup Generator</h1>
            <p className="text-sm text-neutral-400 mt-1">Generate valid JSON-LD structured data for rich results</p>
          </div>
          <div className={cn('flex items-center gap-2 text-sm', isValid ? 'text-emerald-400' : 'text-amber-400')}>
            {isValid ? (
              <>
                <Check className="w-4 h-4" />
                <span>Valid schema</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Fill required fields</span>
              </>
            )}
          </div>
        </div>

        <Tabs value={schemaType} onValueChange={setSchemaType} className="space-y-4">
          <TabsList className="bg-white/5 border border-white/10">
            {['FAQPage', 'HowTo', 'Article', 'Product', 'LocalBusiness', 'BreadcrumbList', 'VideoObject'].map((t) => (
              <TabsTrigger key={t} value={t} className="text-neutral-300 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                {t.replace('Page', '').replace('List', '')}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* FAQPage */}
          <TabsContent value="FAQPage" className="mt-0 space-y-4">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">FAQPage Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <SchemaGeneratorInner
                  faqs={faqs}
                  updateFaq={updateFaq}
                  removeFaq={removeFaq}
                  addFaq={addFaq}
                />
                {schema && (
                  <SchemaOutput
                    jsonLD={jsonLD}
                    schema={schema}
                    copied={copied}
                    generating={generating}
                    onGenerate={generate}
                    onCopy={copyToClipboard}
                    onDownload={() => downloadJson(schema, 'faq-schema.json')}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HowTo */}
          <TabsContent value="HowTo" className="mt-0 space-y-4">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">HowTo Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <SchemaGeneratorInner>
                  {renderHowTo()}
                </SchemaGeneratorInner>
                {schema && (
                  <SchemaOutput
                    jsonLD={jsonLD}
                    schema={schema}
                    copied={copied}
                    generating={generating}
                    onGenerate={generate}
                    onCopy={copyToClipboard}
                    onDownload={() => downloadJson(schema, 'howto-schema.json')}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Article */}
          <TabsContent value="Article" className="mt-0 space-y-4">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">Article / NewsArticle / BlogPosting Schema</CardTitle>
              </CardHeader>
              <CardContent>
                {renderArticle()}
                {schema && (
                  <SchemaOutput
                    jsonLD={jsonLD}
                    schema={schema}
                    copied={copied}
                    generating={generating}
                    onGenerate={generate}
                    onCopy={copyToClipboard}
                    onDownload={() => downloadJson(schema, 'article-schema.json')}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product */}
          <TabsContent value="Product" className="mt-0 space-y-4">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">Product Schema</CardTitle>
              </CardHeader>
              <CardContent>
                {renderProduct()}
                {schema && (
                  <SchemaOutput
                    jsonLD={jsonLD}
                    schema={schema}
                    copied={copied}
                    generating={generating}
                    onGenerate={generate}
                    onCopy={copyToClipboard}
                    onDownload={() => downloadJson(schema, 'product-schema.json')}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LocalBusiness */}
          <TabsContent value="LocalBusiness" className="mt-0 space-y-4">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">LocalBusiness Schema</CardTitle>
              </CardHeader>
              <CardContent>
                {renderLocalBusiness()}
                {schema && (
                  <SchemaOutput
                    jsonLD={jsonLD}
                    schema={schema}
                    copied={copied}
                    generating={generating}
                    onGenerate={generate}
                    onCopy={copyToClipboard}
                    onDownload={() => downloadJson(schema, 'localbusiness-schema.json')}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BreadcrumbList */}
          <TabsContent value="BreadcrumbList" className="mt-0 space-y-4">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">BreadcrumbList Schema</CardTitle>
              </CardHeader>
              <CardContent>
                {renderBreadcrumb()}
                {schema && (
                  <SchemaOutput
                    jsonLD={jsonLD}
                    schema={schema}
                    copied={copied}
                    generating={generating}
                    onGenerate={generate}
                    onCopy={copyToClipboard}
                    onDownload={() => downloadJson(schema, 'breadcrumb-schema.json')}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* VideoObject */}
          <TabsContent value="VideoObject" className="mt-0 space-y-4">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">VideoObject Schema</CardTitle>
              </CardHeader>
              <CardContent>
                {renderVideo()}
                {schema && (
                  <SchemaOutput
                    jsonLD={jsonLD}
                    schema={schema}
                    copied={copied}
                    generating={generating}
                    onGenerate={generate}
                    onCopy={copyToClipboard}
                    onDownload={() => downloadJson(schema, 'video-schema.json')}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Extracted sub-components to keep the main body clean
function SchemaGeneratorInner({ faqs, updateFaq, removeFaq, addFaq, children }) {
  if (children) return children;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-300">FAQ Items</h4>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={addFaq} className="gap-1">
            + Add
          </Button>
        </div>
      </div>
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">#{i + 1}</span>
            {faqs.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => removeFaq(i)} className="text-neutral-500 hover:text-red-400">
                Remove
              </Button>
            )}
          </div>
          <Input
            placeholder="Question"
            value={faq.question}
            onChange={(e) => updateFaq(i, 'question', e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
          />
          <Textarea
            placeholder="Answer"
            value={faq.answer}
            onChange={(e) => updateFaq(i, 'answer', e.target.value)}
            rows={3}
            className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
          />
        </div>
      ))}
    </div>
  );
}

function SchemaOutput({ jsonLD, schema, copied, generating, onGenerate, onCopy, onDownload }) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCopy}
          className="gap-1"
          disabled={generating}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy JSON-LD
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDownload}
          className="gap-1"
        >
          <Download className="w-4 h-4" />
          Download JSON
        </Button>
      </div>
      <div className="relative">
        <Textarea
          value={jsonLD}
          readOnly
          rows={10}
          className="font-mono text-xs bg-black/50 border-white/10 text-emerald-300 cursor-text resize-y"
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
}
