const fs = require('fs');
let code = fs.readFileSync('src/components/StudentManagement.tsx', 'utf8');

// I thought I added CheckCircle and Shield, let's see.
code = code.replace(
  "import { Search, UserPlus, MessageCircle, Users, FileDown, FileUp, Edit2, Trash2, BookOpen, X, Check, Eye, Filter, Trash, CheckCircle2, MoreHorizontal, Coins, Info, FileSpreadsheet, AlertTriangle } from 'lucide-react';",
  "import { Search, UserPlus, MessageCircle, Users, FileDown, FileUp, Edit2, Trash2, BookOpen, X, Check, Eye, Filter, Trash, CheckCircle2, MoreHorizontal, Coins, Info, FileSpreadsheet, AlertTriangle, Shield, CheckCircle } from 'lucide-react';"
);

fs.writeFileSync('src/components/StudentManagement.tsx', code, 'utf8');
console.log('Success fix imports');
