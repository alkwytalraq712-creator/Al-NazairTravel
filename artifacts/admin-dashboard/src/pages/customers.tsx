import React from 'react';
import { useListCustomers } from '@workspace/api-client-react';
import { Loader2, Search, Mail, Phone, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDateAr } from '@/lib/translations';

export function Customers() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const { data: customers, isLoading } = useListCustomers();

  const filteredCustomers = customers?.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">العملاء</h1>
          <p className="text-muted-foreground mt-1">إدارة العملاء المسجلين وعرض ملفاتهم الشخصية.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="البحث عن العملاء..." 
            className="ps-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredCustomers?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">لم يتم العثور على عملاء</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
              لا يوجد عملاء يطابقون معايير البحث الخاصة بك. جرب اسماً أو بريداً إلكترونياً أو رقم هاتف آخر.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCustomers?.map((customer) => (
            <Card key={customer.id} className="hover-elevate transition-all border-border/50 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 border border-border/50 shadow-sm">
                    <AvatarImage src={customer.avatarUrl || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {customer.fullName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                      {customer.fullName}
                    </h3>
                    <div className="flex flex-col gap-1.5 mt-2">
                      <div className="flex items-center text-sm text-muted-foreground truncate" dir="ltr">
                        <Phone className="w-3.5 h-3.5 ms-2 flex-shrink-0" />
                        <span className="truncate w-full text-end">{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center text-sm text-muted-foreground truncate">
                          <Mail className="w-3.5 h-3.5 me-2 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3.5 h-3.5 me-2 flex-shrink-0" />
                        انضم {formatDateAr(customer.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
