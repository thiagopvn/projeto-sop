
import { createIcons, Eye, Download, Trash2, Edit } from 'lucide';

const BUNDLE = {
  Eye,
  Download,
  Trash2,
  Edit,
};

export const getIcon = (name) => {
  const icon = BUNDLE[name];
  if (!icon) {
    // eslint-disable-next-line no-console
    console.warn(`Icon ${name} not found`);
    return '';
  }
  const [tag, attrs, children] = icon;
  const svg = `<${tag} ${Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ')}>${children
    .map(([childTag, childAttrs]) => `<${childTag} ${Object.entries(childAttrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')} />`)
    .join('')}</${tag}>`;
  return svg;
};

export const IconButton = ({ title, icon, onClick }) => {
  const button = document.createElement('button');
  button.title = title;
  button.classList.add('icon-button');
  button.innerHTML = getIcon(icon);
  if (onClick) {
    button.addEventListener('click', onClick);
  }
  return button;
};

createIcons({
  icons: {
    Eye,
    Download,
    Trash2,
    Edit,
  },
});
