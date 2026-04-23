package com.wavemaker.when_to_work.getCategoryGroups.service;


import com.wavemaker.when_to_work.getCategoryGroups.model.*;
import com.wavemaker.when_to_work.getCategoryGroups.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface GetCategoryGroupsService {

  /**
   * 
   * 
    * @param Authorization Authorization (optional)
    * @param companyId companyId (optional)
    * @param status status (optional)
   * @return RootResponse
   */
  @RequestLine("GET /category-groups?companyId={companyId}&status={status}")
  @Headers({
    "Accept: application/json",
    "Authorization: {Authorization}"  })
  RootResponse invoke(@Param("Authorization") String Authorization, @Param("companyId") String companyId, @Param("status") String status);


    /**
     * 
     * 
     * Note, this is equivalent to the other <code>invoke</code> method,
     * but with the query parameters collected into a single Map parameter. This
     * is convenient for services with optional query parameters, especially when
     * used with the {@link InvokeQueryParams} class that allows for
     * building up this map in a fluent style.
     * @param Authorization Authorization (optional)
     * @param queryParams Map of query parameters as name-value pairs
     *   <p>The following elements may be specified in the query map:</p>
     *   <ul>
     *   <li>companyId - companyId (optional)</li>
     *   <li>status - status (optional)</li>
     *   </ul>
     * @return RootResponse
     */
    @RequestLine("GET /category-groups?companyId={companyId}&status={status}")
    @Headers({
    "Accept: application/json",
        "Authorization: {Authorization}"    })
    RootResponse invoke
    (@Param("Authorization") String Authorization, @QueryMap(encoded=true)
    MultiValueMap<String, String> queryParams);

}
